using Microsoft.AspNetCore.Http;
using SashaServer.Data;
using SashaServer.Models;
using System.Threading.Tasks;

namespace SashaServer.Middleware
{
    public class AuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly DataMap _data;

        public AuthMiddleware(RequestDelegate next, DataMap data)
        {
            _next = next;
            _data = data;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Request.Cookies.TryGetValue("AuthToken", out var token))
            {
                var user = _data.GetUserByToken(token);
                if (user != null)
                {
                    context.Items["User"] = user;
                }
            }

            await _next(context);
        }
    }
}
