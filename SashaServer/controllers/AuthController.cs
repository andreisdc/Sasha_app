using Microsoft.AspNetCore.Mvc;
using SashaServer.Data;
using SashaServer.Models;
using BCrypt.Net;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Security.Claims;

namespace SashaServer.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly DataMap _data;
        private readonly IConfiguration _config;

        public AuthController(DataMap data, IConfiguration config)
        {
            _data = data;
            _config = config;
        }

        [HttpPost("signup")]
        public IActionResult Signup([FromBody] SignupRequest req)
        {
            if (string.IsNullOrEmpty(req.Email) || string.IsNullOrEmpty(req.Password))
                return BadRequest(new { message = "Email and password are required" });

            var existing = _data.GetUsers().FirstOrDefault(u => u.Email == req.Email);
            if (existing != null)
                return Conflict(new { message = "Email already registered" });

            var user = new User
            {
                FirstName = req.FirstName,
                LastName  = req.LastName,
                Username  = req.Username,
                Email     = req.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Rating    = 0, // always start at 0
                CreatedAt = DateTime.UtcNow
            };

            _data.AddUser(user);

            return Ok(new { message = "User registered successfully" });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            var user = _data.GetUsers().FirstOrDefault(u => u.Email == req.Email);
            if (user == null) 
                return Unauthorized(new { message = "Invalid credentials" });

            if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Unauthorized(new { message = "Invalid credentials" });

            var token = GenerateJwt(user);
            return Ok(new { token, username = user.Username, email = user.Email });
        }

        private string GenerateJwt(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(double.Parse(_config["Jwt:ExpireHours"]!)),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
