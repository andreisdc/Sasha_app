using Microsoft.AspNetCore.Http;
using SashaServer.Services;

namespace SashaServer.Middleware
{
    public class AuthMiddleware
    {
        private readonly RequestDelegate _next;

        public AuthMiddleware(RequestDelegate next) => _next = next;

        public async Task InvokeAsync(HttpContext context, AuthService auth)
        {
            if (context.Request.Cookies.TryGetValue("AuthToken", out var token))
            {
                if (auth.ValidateToken(token, out var user))
                {
                    context.Items["User"] = user;
                }
            }

            await _next(context);
        }
    }
}
