using Microsoft.AspNetCore.Mvc;
using SashaServer.Models;
using SashaServer.Services;

namespace SashaServer.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _auth;

        public AuthController(AuthService auth) => _auth = auth;

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
<<<<<<< HEAD
            var user = _data.GetUsers().FirstOrDefault(u => u.Email == req.Email);
            if (user == null) return Unauthorized(new { message = "Invalid credentials" });

            if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Unauthorized(new { message = "Invalid credentials" });

            var token = GenerateJwt(user);
            return Ok(new
            {
                token,
                username = user.Username,
                email = user.Email,
                rememberMe = req.RememberMe
            });
        }

        private string GenerateJwt(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
=======
            try
>>>>>>> parent of abe9d58 (implement secure structure)
            {
                var token = _auth.Login(req.Email, req.Password, req.RememberMe);
                Response.Cookies.Append("AuthToken", token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    Expires = DateTime.UtcNow.AddDays(req.RememberMe ? 7 : 1)
                });
                return Ok(new { message = "Logged in successfully" });
            }
            catch
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }
        }
<<<<<<< HEAD
=======

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            if (Request.Cookies.TryGetValue("AuthToken", out var token))
            {
                _auth.Logout(token);
                Response.Cookies.Delete("AuthToken");
            }
            return Ok(new { message = "Logged out" });
        }
>>>>>>> parent of abe9d58 (implement secure structure)
    }
}

