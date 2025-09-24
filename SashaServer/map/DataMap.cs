using Npgsql;
using System.Collections.Generic;
using SashaServer.Data;

namespace SashaServer.Data
{
    public class DataMap
    {
        private readonly string _connectionString;

        public DataMap(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("Postgres")!;
        }

        public void AddUser(User user)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();

            var cmd = new NpgsqlCommand(
                "INSERT INTO t_users (id, username, email, password_hash, is_active, created_at) " +
                "VALUES (@id, @username, @email, @password_hash, @is_active, @created_at)", connection);

            cmd.Parameters.AddWithValue("id", user.Id);
            cmd.Parameters.AddWithValue("username", user.Username);
            cmd.Parameters.AddWithValue("email", user.Email);
            cmd.Parameters.AddWithValue("password_hash", user.PasswordHash);
            cmd.Parameters.AddWithValue("is_active", user.IsActive);
            cmd.Parameters.AddWithValue("created_at", user.CreatedAt);

            cmd.ExecuteNonQuery();
        }

        public List<User> GetUsers()
        {
            var users = new List<User>();
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();

            var cmd = new NpgsqlCommand("SELECT id, username, email, password_hash, is_active, created_at FROM t_users", connection);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                users.Add(new User
                {
                    Id = reader.GetGuid(0),
                    Username = reader.GetString(1),
                    Email = reader.GetString(2),
                    PasswordHash = reader.GetString(3),
                    IsActive = reader.GetBoolean(4),
                    CreatedAt = reader.GetDateTime(5)
                });
            }

            return users;
        }
    }
}
