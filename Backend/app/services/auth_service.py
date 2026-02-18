from bcrypt import hashpw, gensalt, checkpw
from typing import Tuple, Any, Optional
from fastapi import Request
import random
from supabase import Client


class AuthService:
    def __init__(self):
        pass


    # ---------------------------
    # USER FETCH
    # ---------------------------
    def get_user(self, db: Client, username: str) -> Optional[dict]:
        try:
            response = (
                db.table("users")
                .select("id, user_name, role, password")
                .eq("user_name", username)
                .single()
                .execute()
            )
        except Exception:
            return None

        data = response.data
        if not isinstance(data, dict):
            return None

        return data


    # ---------------------------
    # AUDIT LOGGING
    # ---------------------------
    def log_event(self, db: Client, actor: str, action: str, details: str, request: Request):
        try:
            ip = request.client.host if request.client else "unknown"
        except Exception:
            ip = "unknown"

        try:
            ua = request.headers.get("user-agent", "unknown")
        except Exception:
            ua = "unknown"

        data = {
            "actor": actor,
            "action": action,
            "details": details,
            "ip": ip,
            "user_agent": ua,
        }

        try:
            db.table("app_audit_logs").insert(data).execute()
        except Exception:
            pass


    # ---------------------------
    # HASHING
    # ---------------------------
    def hash_pin(self, pin: str) -> str:
        return hashpw(pin.encode(), gensalt()).decode()

    def verify_pin(self, pin: str, hashed_pin: str) -> bool:
        return checkpw(pin.encode(), hashed_pin.encode())


    # ---------------------------
    # ACCOUNT NUMBER GENERATION
    # ---------------------------
    def generate_account_no(self) -> str:
        return "AC" + str(random.randint(10**9, 10**10 - 1))


    # ---------------------------
    # CREATE CUSTOMER ACCOUNT
    # ---------------------------
    def create(
        self,
        db: Client,
        holder: str,
        pin: str,
        vpin: str,
        mobileno: str,
        gmail: str
    ) -> Tuple[bool, Any]:

        # Validation
        if len(pin) != 4 or not pin.isdigit():
            return False, "PIN must be 4 digits."

        if pin != vpin:
            return False, "PINs do not match."

        if len(mobileno) != 10 or not mobileno.isdigit():
            return False, "Invalid mobile number."

        if '@' not in gmail or gmail.count("@") != 1:
            return False, "Invalid email."

        try:
            account_no = self.generate_account_no()
            hashed = self.hash_pin(pin)
        except Exception as e:
            return False, f"Server Error: {e}"

        # Insert into users
        try:
            user_res = (
                db.table("users")
                .insert({
                    "user_name": account_no,
                    "password": hashed,
                    "role": "customer",
                })
                .execute()
            )
        except Exception as e:
            msg = str(e).lower()
            if "duplicate" in msg:
                return False, "User already exists."
            return False, f"User creation failed: {e}"

        data = user_res.data
        if not isinstance(data, list) or not data:
            return False, "User insert failed."

        row = data[0]
        if not isinstance(row, dict) or "id" not in row:
            return False, "User insert failed."

        user_id = row["id"]

        # Insert into accounts
        try:
            acc_res = (
                db.table("accounts")
                .insert({
                    "account_no": account_no,
                    "name": holder,
                    "pin": hashed,
                    "mobileno": mobileno,
                    "gmail": gmail,
                    "failed_attempts": 0,
                    "is_locked": False,
                    "user_id": user_id,
                })
                .execute()
            )
        except Exception as e:
            # Rollback user
            db.table("users").delete().eq("id", user_id).execute()

            msg = str(e).lower()
            if "duplicate" in msg:
                return False, "Account already exists."
            return False, f"Database Error: {e}"

        return True, {
            "account_no": account_no,
            "message": f"Account created successfully with Acc_No {account_no}"
        }


    # ---------------------------
    # CREATE EMPLOYEE
    # ---------------------------
    def create_employ(
        self,
        db: Client,
        username: str,
        pas: str,
        role: str
    ) -> Tuple[bool, str]:

        try:
            hashed = self.hash_pin(pas)

            db.table("users").insert({
                "user_name": username,
                "password": hashed,
                "role": role
            }).execute()

            return True, f"User created: {username}"

        except Exception as e:
            msg = str(e).lower()
            if "duplicate" in msg or "unique constraint" in msg:
                return False, "Username already exists."

            return False, f"Database Error: {e}"


    # ---------------------------
    # PASSWORD CHECK
    # ---------------------------
    def password_check(self, db: Client, username: str, pw: str) -> bool:

        try:
            resp = (
                db.table("users")
                .select("password")
                .eq("user_name", username)
                .limit(1)
                .execute()
            )
        except Exception:
            return False

        data = resp.data
        if not isinstance(data, list) or not data:
            return False

        row = data[0]
        if not isinstance(row, dict):
            return False

        stored_hash = row.get("password")
        if not isinstance(stored_hash, str):
            return False

        return checkpw(pw.encode(), stored_hash.encode())


    # ---------------------------
    # PIN CHECK WITH LOCKING
    # ---------------------------
    def check(
        self,
        db: Client,
        ac_no: str,
        pin: str,
        request: Request
    ) -> Tuple[bool, str]:

        pin = str(pin).strip()

        try:
            response = (
                db.table("accounts")
                .select("pin, failed_attempts, is_locked")
                .eq("account_no", ac_no)
                .single()
                .execute()
            )
        except Exception as e:
            self.log_event(db, "unknown", "pin_failed", f"DB Error: {e}", request)
            return False, "Server error. Try again."

        data = response.data
        if not isinstance(data, dict):
            self.log_event(db, "unknown", "pin_failed", "Account not found", request)
            return False, "Account not found."

        stored_hash = data.get("pin")
        attempts = data.get("failed_attempts", 0)
        locked = data.get("is_locked", False)

        if not isinstance(stored_hash, str):
            return False, "Server error."

        if not isinstance(attempts, int):
            attempts = 0

        if not isinstance(locked, bool):
            locked = False

        if locked:
            self.log_event(db, ac_no, "pin_failed", "Account locked", request)
            return False, "Account locked. Contact bank."

        if self.verify_pin(pin, stored_hash):
            try:
                db.table("accounts").update({
                    "failed_attempts": 0
                }).eq("account_no", ac_no).execute()
            except Exception:
                pass

            self.log_event(db, ac_no, "pin_success", "PIN verified", request)
            return True, "PIN verified."

        attempts += 1

        if attempts >= 3:
            try:
                db.table("accounts").update({
                    "failed_attempts": attempts,
                    "is_locked": True
                }).eq("account_no", ac_no).execute()
            except Exception:
                pass

            self.log_event(db, ac_no, "account_locked", "3 wrong attempts", request)
            return False, "Account locked after 3 wrong PIN attempts."

        try:
            db.table("accounts").update({
                "failed_attempts": attempts
            }).eq("account_no", ac_no).execute()
        except Exception:
            pass

        self.log_event(db, ac_no, "pin_failed", f"Wrong PIN, {3 - attempts} tries left", request)

        return False, f"Wrong PIN. {3 - attempts} tries left."
