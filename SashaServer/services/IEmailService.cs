using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace SashaServer.Services
{
    public interface IEmailService
    {
        void SendConfirmationEmail(string toEmail, string username);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public void SendConfirmationEmail(string toEmail, string username)
        {
            var smtpHost = _config["Email:SmtpHost"];
            var smtpPort = int.Parse(_config["Email:SmtpPort"] ?? "587");
            var smtpUser = _config["Email:SmtpUser"];
            var smtpPass = _config["Email:SmtpPass"];
            var fromEmail = _config["Email:From"];

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };

            var mail = new MailMessage(fromEmail, toEmail)
            {
                Subject = "Confirm your account",
                Body = $"Hello {username}, please confirm your email to activate your account.",
                IsBodyHtml = false
            };

            client.Send(mail);
        }
    }
}
