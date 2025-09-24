using Microsoft.AspNetCore.Mvc;
using Npgsql;
using SashaServer.Data;
using System.Security.Cryptography;
using System.Text;

namespace SashaServer.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RegisterController : ControllerBase
    {
        private readonly ILogger<RegisterController> _logger;
        private readonly string _connectionString = "Host=localhost;Username=postgres;Password=yourpassword;Database=yourdb";

        public RegisterController(ILogger<RegisterController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public IActionResult Register([FromBody] User user)
        {
            _logger.LogInformation("[{Time}] Register request for user {Username}", DateTime.Now, user.Username);

            // Hash password
            user.PasswordHash = HashPassword(user.PasswordHash);

            try
            {
                using var connection = new NpgsqlConnection(_connectionString);
                connection.Open();

                var command = new NpgsqlCommand(
                    "INSERT INTO t_users (id, username, email, password_hash, is_active, created_at) " +
                    "VALUES (@id, @username, @email, @password_hash, @is_active, @created_at)", connection);

                command.Parameters.AddWithValue("id", user.Id);
                command.Parameters.AddWithValue("username", user.Username);
                command.Parameters.AddWithValue("email", user.Email);
                command.Parameters.AddWithValue("password_hash", user.PasswordHash);
                command.Parameters.AddWithValue("is_active", user.IsActive);
                command.Parameters.AddWithValue("created_at", user.CreatedAt);

                command.ExecuteNonQuery();

                _logger.LogInformation("[{Time}] User {Username} registered successfully", DateTime.Now, user.Username);

                return Ok(new { Message = "User registered successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{Time}] Error registering user {Username}", DateTime.Now, user.Username);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            StringBuilder builder = new StringBuilder();
            foreach (var b in bytes)
                builder.Append(b.ToString("x2"));
            return builder.ToString();
        }
    }
}
