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
            try
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
    }
}
