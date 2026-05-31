import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from app.config import SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_TO_EMAIL, IS_EMAIL_CONFIGURED
from app.models import global_state, AlertNotification

class EmailService:
    @staticmethod
    def send_alert(subject: str, body: str) -> bool:
        timestamp = datetime.now().strftime("%I:%M:%S %p")
        
        # 1. Log to system alerts history (always, for mock simulation and display)
        new_alert = AlertNotification(
            type="Email",
            subject=subject,
            body=body,
            timestamp=timestamp
        )
        global_state.alerts_history.insert(0, new_alert)
        print(f"[Email Alert Logged]: {subject} - {body}")

        # 2. If SMTP is configured, send the real email
        if IS_EMAIL_CONFIGURED:
            try:
                msg = MIMEMultipart()
                msg['From'] = SMTP_USER
                msg['To'] = SMTP_TO_EMAIL
                msg['Subject'] = f"[Zentra Flora Alert] {subject}"
                
                msg.attach(MIMEText(body, 'plain'))
                
                server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_USER, SMTP_TO_EMAIL, msg.as_string())
                server.quit()
                print(f"[SMTP Email Sent Successfully to {SMTP_TO_EMAIL}]")
                return True
            except Exception as e:
                print(f"[SMTP Email Failed Error]: {str(e)}")
                return False
        else:
            print("[SMTP not configured in .env - Running in Simulation Mode]")
            return True
        
        return True
