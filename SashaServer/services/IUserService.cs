using SashaServer.Data;
using SashaServer.Models;
using System.Security.Cryptography;
using System.Text;

namespace SashaServer.Services
{
    public interface IUserService
    {
        void Register(User user);
        List<User> GetAll();
    }

    public class UserService : IUserService
    {
        private readonly DataMap _data;

        public UserService(DataMap data)
        {
            _data = data;
        }

        public void Register(User user)
        {
            // hash password before saving
            user.PasswordHash = HashPassword(user.PasswordHash);
            _data.AddUser(user);
        }

        public List<User> GetAll() => _data.GetUsers();

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLower();
        }
    }
}
