using SashaServer.Data;
using SashaServer.Models;

namespace SashaServer.Services
{
    public class AuthService
    {
        private readonly DataMap _data;

        public AuthService(DataMap data)
        {
            _data = data;
        }

        public string Login(string email, string password, bool rememberMe)
        {
            var user = _data.GetUsers().FirstOrDefault(u => u.Email == email);
            if (user == null || user.PasswordHash != HashPassword(password))
                throw new UnauthorizedAccessException("Invalid credentials");

            var token = Guid.NewGuid().ToString();
            var expiresAt = DateTime.UtcNow.AddDays(rememberMe ? 7 : 1);

            _data.AddSession(user.Id, token, expiresAt);

            return token;
        }

        public bool ValidateToken(string token, out User? user)
        {
            user = _data.GetUserByToken(token);
            return user != null;
        }

        public void Logout(string token)
        {
            _data.DeleteSession(token);
        }

        private static string HashPassword(string password)
        {
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            byte[] bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLower();
        }
    }
}
