using Npgsql;
using SashaServer.Models;

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
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                "INSERT INTO t_users (id, username, email, password_hash, is_active, created_at) VALUES (@id, @username, @email, @password_hash, @is_active, @created_at)", 
                conn);
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
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("SELECT id, username, email, password_hash, is_active, created_at FROM t_users", conn);
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

        public bool UserExists(string email)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("SELECT COUNT(1) FROM t_users WHERE email = @Email", conn);
            cmd.Parameters.AddWithValue("Email", email);
            return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
        }

        public bool DeleteUser(string email)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_users WHERE email = @Email", conn);
            cmd.Parameters.AddWithValue("Email", email);
            return cmd.ExecuteNonQuery() > 0;
        }

        public void AddSession(Guid userId, string token, DateTime expiresAt)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("INSERT INTO user_sessions (id, user_id, token, expires_at) VALUES (@id, @user_id, @token, @expires_at)", conn);
            cmd.Parameters.AddWithValue("id", Guid.NewGuid());
            cmd.Parameters.AddWithValue("user_id", userId);
            cmd.Parameters.AddWithValue("token", token);
            cmd.Parameters.AddWithValue("expires_at", expiresAt);
            cmd.ExecuteNonQuery();
        }

        public User? GetUserByToken(string token)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(@"SELECT u.id, u.username, u.email, u.password_hash, u.is_active, u.created_at
                                           FROM t_users u
                                           JOIN user_sessions s ON s.user_id = u.id
                                           WHERE s.token = @token AND s.expires_at > NOW()", conn);
            cmd.Parameters.AddWithValue("token", token);
            using var reader = cmd.ExecuteReader();
            if (!reader.Read()) return null;
            return new User
            {
                Id = reader.GetGuid(0),
                Username = reader.GetString(1),
                Email = reader.GetString(2),
                PasswordHash = reader.GetString(3),
                IsActive = reader.GetBoolean(4),
                CreatedAt = reader.GetDateTime(5)
            };
        }

        public void DeleteSession(string token)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM user_sessions WHERE token = @token", conn);
            cmd.Parameters.AddWithValue("token", token);
            cmd.ExecuteNonQuery();
        }
    }
}
