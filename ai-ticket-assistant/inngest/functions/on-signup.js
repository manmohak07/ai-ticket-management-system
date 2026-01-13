import { inngest } from "../client.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";

export const onUserSignup = inngest.createFunction(
  { id: "on-user-signup", retries: 2 },
  { event: "user/signup" },
  async ({ event, step }) => {
    try {
      const { email } = event.data;
      const user = await step.run("get-user-email", async () => {
        const userObject = await User.findOne({ email });
        if (!userObject) {
          throw new NonRetriableError("User no longer exists in our database");
        }
        return userObject;
      });

      const emailResult = await step.run("send-welcome-email", async () => {
        const subject = `Welcome to TicketAI`;
        const message = `Hi ${user.email},

Thanks for signing up for TicketAI! We're glad to have you onboard.

You're now ready to create and manage support tickets with AI-powered intelligence.

Best regards,
The TicketAI Team`;
        const result = await sendMail(user.email, subject, message);
        return { sent: true, messageId: result?.messageId };
      });

      return { success: true, emailSent: emailResult };
    } catch (error) {
      console.error("❌ Error running step", error.message);
      return { success: false, error: error.message };
    }
  }
);
