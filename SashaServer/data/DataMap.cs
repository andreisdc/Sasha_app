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

        // ================================
        // 1️⃣ Users
        // ================================
        public void AddUser(User user)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"INSERT INTO t_users 
                  (id, first_name, last_name, username, email, password_hash, rating, is_seller, profile_picture, created_at) 
                  VALUES (@id, @first_name, @last_name, @username, @email, @password_hash, @rating, @is_seller, @profile_picture, @created_at)",
                conn);

            cmd.Parameters.AddWithValue("id", user.Id);
            cmd.Parameters.AddWithValue("first_name", user.FirstName);
            cmd.Parameters.AddWithValue("last_name", user.LastName);
            cmd.Parameters.AddWithValue("username", user.Username);
            cmd.Parameters.AddWithValue("email", user.Email);
            cmd.Parameters.AddWithValue("password_hash", user.PasswordHash);
            cmd.Parameters.AddWithValue("rating", user.Rating);
            cmd.Parameters.AddWithValue("is_seller", user.IsSeller);
            cmd.Parameters.AddWithValue("profile_picture", (object?)user.ProfilePicture ?? DBNull.Value);
            cmd.Parameters.AddWithValue("created_at", user.CreatedAt);
            cmd.ExecuteNonQuery();
        }

        public User? GetUserByEmail(string email)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"SELECT id, first_name, last_name, username, email, password_hash, rating, is_seller, profile_picture, created_at 
                  FROM t_users WHERE email = @Email",
                conn);
            cmd.Parameters.AddWithValue("Email", email);

            using var reader = cmd.ExecuteReader();
            if (!reader.Read()) return null;

            return new User
            {
                Id = reader.GetGuid(0),
                FirstName = reader.GetString(1),
                LastName = reader.GetString(2),
                Username = reader.GetString(3),
                Email = reader.GetString(4),
                PasswordHash = reader.GetString(5),
                Rating = reader.GetInt16(6),
                IsSeller = reader.GetBoolean(7),
                ProfilePicture = reader.IsDBNull(8) ? null : reader.GetString(8),
                CreatedAt = reader.GetDateTime(9)
            };
        }

        public bool DeleteUser(string email)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_users WHERE email = @Email", conn);
            cmd.Parameters.AddWithValue("Email", email);
            return cmd.ExecuteNonQuery() > 0;
        }

public User? GetUserByToken(string token)
{
    using var conn = new NpgsqlConnection(_connectionString);
    conn.Open();
    var cmd = new NpgsqlCommand(
        @"SELECT u.id, u.first_name, u.last_name, u.username, u.email, u.password_hash, u.rating, u.created_at, u.phone_number, u.is_seller, u.profile_picture
          FROM t_users u
          JOIN user_sessions s ON s.user_id = u.id
          WHERE s.token = @token AND s.expires_at > NOW()", 
        conn);
    cmd.Parameters.AddWithValue("token", token);
    using var reader = cmd.ExecuteReader();
    if (!reader.Read()) return null;

    return new User
    {
        Id = reader.GetGuid(0),
        FirstName = reader.GetString(1),
        LastName = reader.GetString(2),
        Username = reader.GetString(3),
        Email = reader.GetString(4),
        PasswordHash = reader.GetString(5),
        Rating = reader.GetInt32(6),
        CreatedAt = reader.GetDateTime(7),
        PhoneNumber = reader.IsDBNull(8) ? null : reader.GetString(8),
        IsSeller = reader.GetBoolean(9),
        ProfilePicture = reader.IsDBNull(10) ? null : reader.GetString(10)
    };
}


public bool UserExists(string email)
{
    using var conn = new NpgsqlConnection(_connectionString);
    conn.Open();
    var cmd = new NpgsqlCommand("SELECT COUNT(1) FROM t_users WHERE email = @Email", conn);
    cmd.Parameters.AddWithValue("Email", email);
    return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
}

public List<User> GetUsers()
{
    var users = new List<User>();
    using var conn = new NpgsqlConnection(_connectionString);
    conn.Open();
    var cmd = new NpgsqlCommand(
        @"SELECT id, first_name, last_name, username, email, password_hash, rating, created_at, phone_number, is_seller, profile_picture
          FROM t_users", conn);
    using var reader = cmd.ExecuteReader();
    while (reader.Read())
    {
        users.Add(new User
        {
            Id = reader.GetGuid(0),
            FirstName = reader.GetString(1),
            LastName = reader.GetString(2),
            Username = reader.GetString(3),
            Email = reader.GetString(4),
            PasswordHash = reader.GetString(5),
            Rating = reader.GetInt32(6),
            CreatedAt = reader.GetDateTime(7),
            PhoneNumber = reader.IsDBNull(8) ? null : reader.GetString(8),
            IsSeller = reader.GetBoolean(9),
            ProfilePicture = reader.IsDBNull(10) ? null : reader.GetString(10)
        });
    }
    return users;
}




        // ================================
        // 2️⃣ Properties
        // ================================
      public void AddProperty(Property property)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();

            var cmd = new NpgsqlCommand(
                @"INSERT INTO t_properties
                  (id, owner_id, title, description, location_type, address, city, county, country,
                   postal_code, latitude, longitude, status, price_per_night, min_nights, max_nights,
                   check_in_time, check_out_time, max_guests, bathrooms, kitchen, living_space, pet_friendly,
                   smoke_detector, fire_extinguisher, carbon_monoxide_detector, lock_type,
                   average_rating, review_count, neighborhood_description, tags, instant_book,
                   created_at, updated_at)
                  VALUES
                  (@id, @owner_id, @title, @description, @location_type, @address, @city, @county, @country,
                   @postal_code, @latitude, @longitude, @status, @price_per_night, @min_nights, @max_nights,
                   @check_in_time, @check_out_time, @max_guests, @bathrooms, @kitchen, @living_space, @pet_friendly,
                   @smoke_detector, @fire_extinguisher, @carbon_monoxide_detector, @lock_type,
                   @average_rating, @review_count, @neighborhood_description, @tags, @instant_book,
                   @created_at, @updated_at)", conn);

            cmd.Parameters.AddWithValue("id", property.Id);
            cmd.Parameters.AddWithValue("owner_id", property.OwnerId);
            cmd.Parameters.AddWithValue("title", property.Title);
            cmd.Parameters.AddWithValue("description", property.Description);
            cmd.Parameters.AddWithValue("location_type", property.LocationType);
            cmd.Parameters.AddWithValue("address", property.Address ?? "");
            cmd.Parameters.AddWithValue("city", property.City ?? "");
            cmd.Parameters.AddWithValue("county", property.County ?? "");
            cmd.Parameters.AddWithValue("country", property.Country ?? "Romania");
            cmd.Parameters.AddWithValue("postal_code", property.PostalCode ?? "");
            cmd.Parameters.AddWithValue("latitude", property.Latitude);
            cmd.Parameters.AddWithValue("longitude", property.Longitude);
            cmd.Parameters.AddWithValue("status", property.Status);
            cmd.Parameters.AddWithValue("price_per_night", property.PricePerNight);
            cmd.Parameters.AddWithValue("min_nights", property.MinNights);
            cmd.Parameters.AddWithValue("max_nights", property.MaxNights);
            cmd.Parameters.AddWithValue("check_in_time", property.CheckInTime);
            cmd.Parameters.AddWithValue("check_out_time", property.CheckOutTime);
            cmd.Parameters.AddWithValue("max_guests", property.MaxGuests);
            cmd.Parameters.AddWithValue("bathrooms", property.Bathrooms);
            cmd.Parameters.AddWithValue("kitchen", property.Kitchen);
            cmd.Parameters.AddWithValue("living_space", property.LivingSpace);
            cmd.Parameters.AddWithValue("pet_friendly", property.PetFriendly);
            cmd.Parameters.AddWithValue("smoke_detector", property.SmokeDetector);
            cmd.Parameters.AddWithValue("fire_extinguisher", property.FireExtinguisher);
            cmd.Parameters.AddWithValue("carbon_monoxide_detector", property.CarbonMonoxideDetector);
            cmd.Parameters.AddWithValue("lock_type", property.LockType ?? "");
            cmd.Parameters.AddWithValue("average_rating", property.AverageRating);
            cmd.Parameters.AddWithValue("review_count", property.ReviewCount);
            cmd.Parameters.AddWithValue("neighborhood_description", property.NeighborhoodDescription ?? "");
            cmd.Parameters.AddWithValue("tags", property.Tags ?? Array.Empty<string>()); // ← corect array
            cmd.Parameters.AddWithValue("instant_book", property.InstantBook);
            cmd.Parameters.AddWithValue("created_at", property.CreatedAt);
            cmd.Parameters.AddWithValue("updated_at", property.UpdatedAt);

            cmd.ExecuteNonQuery();
        }

        public List<Property> GetProperties()
        {
            var properties = new List<Property>();

            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();

            var cmd = new NpgsqlCommand(
                @"SELECT id, owner_id, title, description, location_type, address, city, county, country,
                         postal_code, latitude, longitude, status, price_per_night, min_nights, max_nights,
                         check_in_time, check_out_time, max_guests, bathrooms, kitchen, living_space, pet_friendly,
                         smoke_detector, fire_extinguisher, carbon_monoxide_detector, lock_type,
                         average_rating, review_count, neighborhood_description, tags, instant_book,
                         created_at, updated_at
                  FROM t_properties", conn);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                var property = new Property
                {
                    Id = reader.GetGuid(0),
                    OwnerId = reader.GetGuid(1),
                    Title = reader.GetString(2),
                    Description = reader.GetString(3),
                    LocationType = reader.GetString(4),
                    Address = reader.IsDBNull(5) ? "" : reader.GetString(5),
                    City = reader.IsDBNull(6) ? "" : reader.GetString(6),
                    County = reader.IsDBNull(7) ? "" : reader.GetString(7),
                    Country = reader.IsDBNull(8) ? "Romania" : reader.GetString(8),
                    PostalCode = reader.IsDBNull(9) ? "" : reader.GetString(9),
                    Latitude = reader.IsDBNull(10) ? 0 : reader.GetDouble(10),
                    Longitude = reader.IsDBNull(11) ? 0 : reader.GetDouble(11),
                    Status = reader.GetString(12),
                    PricePerNight = reader.GetDecimal(13),
                    MinNights = reader.GetInt32(14),
                    MaxNights = reader.GetInt32(15),
                    CheckInTime = reader.GetTimeSpan(16),
                    CheckOutTime = reader.GetTimeSpan(17),
                    MaxGuests = reader.GetInt32(18),
                    Bathrooms = reader.GetInt32(19),
                    Kitchen = reader.GetBoolean(20),
                    LivingSpace = reader.GetDecimal(21),
                    PetFriendly = reader.GetBoolean(22),
                    SmokeDetector = reader.GetBoolean(23),
                    FireExtinguisher = reader.GetBoolean(24),
                    CarbonMonoxideDetector = reader.GetBoolean(25),
                    LockType = reader.IsDBNull(26) ? "" : reader.GetString(26),
                    AverageRating = reader.GetDecimal(27),
                    ReviewCount = reader.GetInt32(28),
                    NeighborhoodDescription = reader.IsDBNull(29) ? "" : reader.GetString(29),
                    Tags = reader.IsDBNull(30) ? Array.Empty<string>() : reader.GetFieldValue<string[]>(30), // ← corect array
                    InstantBook = reader.GetBoolean(31),
                    CreatedAt = reader.GetDateTime(32),
                    UpdatedAt = reader.GetDateTime(33)
                };

                properties.Add(property);
            }

            return properties;
        }

        // ================================
        // 3️⃣ Property Photos
        // ================================
        public void AddPropertyPhoto(PropertyPhoto photo)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"INSERT INTO t_property_photos
                  (id, property_id, file_path, is_cover, created_at)
                  VALUES (@id, @property_id, @file_path, @is_cover, @created_at)", conn);

            cmd.Parameters.AddWithValue("id", photo.Id);
            cmd.Parameters.AddWithValue("property_id", photo.PropertyId);
            cmd.Parameters.AddWithValue("file_path", photo.FilePath);
            cmd.Parameters.AddWithValue("is_cover", photo.IsCover);
            cmd.Parameters.AddWithValue("created_at", photo.CreatedAt);
            cmd.ExecuteNonQuery();
        }

        public List<PropertyPhoto> GetPropertyPhotos(Guid propertyId)
        {
            var list = new List<PropertyPhoto>();
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("SELECT id, property_id, file_path, is_cover, created_at FROM t_property_photos WHERE property_id=@property_id", conn);
            cmd.Parameters.AddWithValue("property_id", propertyId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new PropertyPhoto
                {
                    Id = reader.GetGuid(0),
                    PropertyId = reader.GetGuid(1),
                    FilePath = reader.GetString(2),
                    IsCover = reader.GetBoolean(3),
                    CreatedAt = reader.GetDateTime(4)
                });
            }
            return list;
        }

        // ================================
        // 4️⃣ Amenities & PropertyAmenities
        // ================================
        public void AddAmenity(Amenity amenity)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"INSERT INTO t_amenities
                  (id, code, name, category, created_at)
                  VALUES (@id, @code, @name, @category, @created_at)", conn);

            cmd.Parameters.AddWithValue("id", amenity.Id);
            cmd.Parameters.AddWithValue("code", amenity.Code);
            cmd.Parameters.AddWithValue("name", amenity.Name);
            cmd.Parameters.AddWithValue("category", (object?)amenity.Category ?? DBNull.Value);
            cmd.Parameters.AddWithValue("created_at", amenity.CreatedAt);
            cmd.ExecuteNonQuery();
        }

        public List<Amenity> GetAmenities()
        {
            var list = new List<Amenity>();
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("SELECT id, code, name, category, created_at FROM t_amenities", conn);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new Amenity
                {
                    Id = reader.GetGuid(0),
                    Code = reader.GetString(1),
                    Name = reader.GetString(2),
                    Category = reader.IsDBNull(3) ? null : reader.GetString(3),
                    CreatedAt = reader.GetDateTime(4)
                });
            }
            return list;
        }

        public void AddPropertyAmenity(PropertyAmenity pa)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"INSERT INTO t_property_amenities
                  (id, property_id, amenity_id, description, created_at)
                  VALUES (@id, @property_id, @amenity_id, @description, @created_at)", conn);

            cmd.Parameters.AddWithValue("id", pa.Id);
            cmd.Parameters.AddWithValue("property_id", pa.PropertyId);
            cmd.Parameters.AddWithValue("amenity_id", pa.AmenityId);
            cmd.Parameters.AddWithValue("description", (object?)pa.Description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("created_at", pa.CreatedAt);
            cmd.ExecuteNonQuery();
        }

        public List<PropertyAmenity> GetPropertyAmenities(Guid propertyId)
        {
            var list = new List<PropertyAmenity>();
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("SELECT id, property_id, amenity_id, description, created_at FROM t_property_amenities WHERE property_id=@property_id", conn);
            cmd.Parameters.AddWithValue("property_id", propertyId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new PropertyAmenity
                {
                    Id = reader.GetGuid(0),
                    PropertyId = reader.GetGuid(1),
                    AmenityId = reader.GetGuid(2),
                    Description = reader.IsDBNull(3) ? null : reader.GetString(3),
                    CreatedAt = reader.GetDateTime(4)
                });
            }
            return list;
        }

        // ================================
        // 5️⃣ Activities & PropertyActivities
        // ================================
        public void AddActivity(Activity activity)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"INSERT INTO t_activities
                  (id, code, name, category, created_at)
                  VALUES (@id, @code, @name, @category, @created_at)", conn);

            cmd.Parameters.AddWithValue("id", activity.Id);
            cmd.Parameters.AddWithValue("code", activity.Code);
            cmd.Parameters.AddWithValue("name", activity.Name);
            cmd.Parameters.AddWithValue("category", (object?)activity.Category ?? DBNull.Value);
            cmd.Parameters.AddWithValue("created_at", activity.CreatedAt);
            cmd.ExecuteNonQuery();
        }

        public List<Activity> GetActivities()
        {
            var list = new List<Activity>();
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("SELECT id, code, name, category, created_at FROM t_activities", conn);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new Activity
                {
                    Id = reader.GetGuid(0),
                    Code = reader.GetString(1),
                    Name = reader.GetString(2),
                    Category = reader.IsDBNull(3) ? null : reader.GetString(3),
                    CreatedAt = reader.GetDateTime(4)
                });
            }
            return list;
        }

        public void AddPropertyActivity(PropertyActivity pa)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"INSERT INTO t_property_activities
                  (id, property_id, activity_id, notes, created_at)
                  VALUES (@id, @property_id, @activity_id, @notes, @created_at)", conn);

            cmd.Parameters.AddWithValue("id", pa.Id);
            cmd.Parameters.AddWithValue("property_id", pa.PropertyId);
            cmd.Parameters.AddWithValue("activity_id", pa.ActivityId);
            cmd.Parameters.AddWithValue("notes", (object?)pa.Notes ?? DBNull.Value);
            cmd.Parameters.AddWithValue("created_at", pa.CreatedAt);
            cmd.ExecuteNonQuery();
        }

        public List<PropertyActivity> GetPropertyActivities(Guid propertyId)
        {
            var list = new List<PropertyActivity>();
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("SELECT id, property_id, activity_id, notes, created_at FROM t_property_activities WHERE property_id=@property_id", conn);
            cmd.Parameters.AddWithValue("property_id", propertyId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new PropertyActivity
                {
                    Id = reader.GetGuid(0),
                    PropertyId = reader.GetGuid(1),
                    ActivityId = reader.GetGuid(2),
                    Notes = reader.IsDBNull(3) ? null : reader.GetString(3),
                    CreatedAt = reader.GetDateTime(4)
                });
            }
            return list;
        }

        // ================================
        // 6️⃣ Bookings
        // ================================
        public void AddBooking(Booking booking)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"INSERT INTO t_bookings
                  (id, property_id, user_id, start_date, end_date, total_price, status, created_at, updated_at)
                  VALUES
                  (@id, @property_id, @user_id, @start_date, @end_date, @total_price, @status, @created_at, @updated_at)", conn);

            cmd.Parameters.AddWithValue("id", booking.Id);
            cmd.Parameters.AddWithValue("property_id", booking.PropertyId);
            cmd.Parameters.AddWithValue("user_id", booking.UserId);
            cmd.Parameters.AddWithValue("start_date", booking.StartDate);
            cmd.Parameters.AddWithValue("end_date", booking.EndDate);
            cmd.Parameters.AddWithValue("total_price", booking.TotalPrice);
            cmd.Parameters.AddWithValue("status", booking.Status);
            cmd.Parameters.AddWithValue("created_at", booking.CreatedAt);
            cmd.Parameters.AddWithValue("updated_at", booking.UpdatedAt);
            cmd.ExecuteNonQuery();
        }

        public List<Booking> GetBookingsForUser(Guid userId)
        {
            var list = new List<Booking>();
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("SELECT * FROM t_bookings WHERE user_id=@user_id", conn);
            cmd.Parameters.AddWithValue("user_id", userId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new Booking
                {
                    Id = reader.GetGuid(0),
                    PropertyId = reader.GetGuid(1),
                    UserId = reader.GetGuid(2),
                    StartDate = reader.GetDateTime(3),
                    EndDate = reader.GetDateTime(4),
                    TotalPrice = reader.GetDecimal(5),
                    Status = reader.GetString(6),
                    CreatedAt = reader.GetDateTime(7),
                    UpdatedAt = reader.GetDateTime(8)
                });
            }
            return list;
        }

        // ================================
        // 7️⃣ Reviews
        // ================================
        public void AddReview(Review review)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"INSERT INTO t_reviews
                  (id, property_id, user_id, rating, comment, created_at)
                  VALUES
                  (@id, @property_id, @user_id, @rating, @comment, @created_at)", conn);

            cmd.Parameters.AddWithValue("id", review.Id);
            cmd.Parameters.AddWithValue("property_id", review.PropertyId);
            cmd.Parameters.AddWithValue("user_id", review.UserId);
            cmd.Parameters.AddWithValue("rating", review.Rating);
            cmd.Parameters.AddWithValue("comment", (object?)review.Comment ?? DBNull.Value);
            cmd.Parameters.AddWithValue("created_at", review.CreatedAt);
            cmd.ExecuteNonQuery();
        }

        public List<Review> GetReviewsForProperty(Guid propertyId)
        {
            var list = new List<Review>();
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("SELECT id, property_id, user_id, rating, comment, created_at FROM t_reviews WHERE property_id=@property_id", conn);
            cmd.Parameters.AddWithValue("property_id", propertyId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new Review
                {
                    Id = reader.GetGuid(0),
                    PropertyId = reader.GetGuid(1),
                    UserId = reader.GetGuid(2),
                    Rating = reader.GetInt16(3),
                    Comment = reader.IsDBNull(4) ? null : reader.GetString(4),
                    CreatedAt = reader.GetDateTime(5)
                });
            }
            return list;
        }

        // ================================
        // 8️⃣ Notifications
        // ================================
        public void AddNotification(Notification notification)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"INSERT INTO t_notifications
                  (id, user_id, message, read, created_at)
                  VALUES
                  (@id, @user_id, @message, @read, @created_at)", conn);

            cmd.Parameters.AddWithValue("id", notification.Id);
            cmd.Parameters.AddWithValue("user_id", notification.UserId);
            cmd.Parameters.AddWithValue("message", notification.Message);
            cmd.Parameters.AddWithValue("read", notification.Read);
            cmd.Parameters.AddWithValue("created_at", notification.CreatedAt);
            cmd.ExecuteNonQuery();
        }

        // ================================
        // 9️⃣ QR Check-in
        // ================================
        public void AddQrCheckin(QrCheckin qr)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"INSERT INTO t_qr_checkin
                  (id, booking_id, qr_code, checked_in, checked_out, created_at, updated_at)
                  VALUES
                  (@id, @booking_id, @qr_code, @checked_in, @checked_out, @created_at, @updated_at)", conn);

            cmd.Parameters.AddWithValue("id", qr.Id);
            cmd.Parameters.AddWithValue("booking_id", qr.BookingId);
            cmd.Parameters.AddWithValue("qr_code", qr.QrCode);
            cmd.Parameters.AddWithValue("checked_in", qr.CheckedIn);
            cmd.Parameters.AddWithValue("checked_out", qr.CheckedOut);
            cmd.Parameters.AddWithValue("created_at", qr.CreatedAt);
            cmd.Parameters.AddWithValue("updated_at", qr.UpdatedAt);
            cmd.ExecuteNonQuery();
        }

        public bool UpdateUser(User user)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"UPDATE t_users SET 
            first_name=@first_name,
            last_name=@last_name,
            username=@username,
            email=@email,
            password_hash=@password_hash,
            rating=@rating,
            is_seller=@is_seller,
            profile_picture=@profile_picture
          WHERE id=@id", conn);

            cmd.Parameters.AddWithValue("id", user.Id);
            cmd.Parameters.AddWithValue("first_name", user.FirstName);
            cmd.Parameters.AddWithValue("last_name", user.LastName);
            cmd.Parameters.AddWithValue("username", user.Username);
            cmd.Parameters.AddWithValue("email", user.Email);
            cmd.Parameters.AddWithValue("password_hash", user.PasswordHash);
            cmd.Parameters.AddWithValue("rating", user.Rating);
            cmd.Parameters.AddWithValue("is_seller", user.IsSeller);
            cmd.Parameters.AddWithValue("profile_picture", (object?)user.ProfilePicture ?? DBNull.Value);

            return cmd.ExecuteNonQuery() > 0;
        }

        public bool DeleteUserById(Guid userId)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_users WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", userId);
            return cmd.ExecuteNonQuery() > 0;
        }


        public bool UpdateProperty(Property property)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"UPDATE t_properties SET
            title=@title,
            description=@description,
            location_type=@location_type,
            address=@address,
            city=@city,
            county=@county,
            country=@country,
            postal_code=@postal_code,
            latitude=@latitude,
            longitude=@longitude,
            status=@status,
            price_per_night=@price_per_night,
            min_nights=@min_nights,
            max_nights=@max_nights,
            check_in_time=@check_in_time,
            check_out_time=@check_out_time,
            max_guests=@max_guests,
            bathrooms=@bathrooms,
            kitchen=@kitchen,
            living_space=@living_space,
            pet_friendly=@pet_friendly,
            smoke_detector=@smoke_detector,
            fire_extinguisher=@fire_extinguisher,
            carbon_monoxide_detector=@carbon_monoxide_detector,
            lock_type=@lock_type,
            average_rating=@average_rating,
            review_count=@review_count,
            neighborhood_description=@neighborhood_description,
            tags=@tags,
            instant_book=@instant_book,
            updated_at=@updated_at
          WHERE id=@id", conn);

            cmd.Parameters.AddWithValue("id", property.Id);
            cmd.Parameters.AddWithValue("title", property.Title);
            cmd.Parameters.AddWithValue("description", (object?)property.Description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("location_type", property.LocationType);
            cmd.Parameters.AddWithValue("address", (object?)property.Address ?? DBNull.Value);
            cmd.Parameters.AddWithValue("city", (object?)property.City ?? DBNull.Value);
            cmd.Parameters.AddWithValue("county", (object?)property.County ?? DBNull.Value);
            cmd.Parameters.AddWithValue("country", property.Country);
            cmd.Parameters.AddWithValue("postal_code", (object?)property.PostalCode ?? DBNull.Value);
            cmd.Parameters.AddWithValue("latitude", (object?)property.Latitude ?? DBNull.Value);
            cmd.Parameters.AddWithValue("longitude", (object?)property.Longitude ?? DBNull.Value);
            cmd.Parameters.AddWithValue("status", property.Status);
            cmd.Parameters.AddWithValue("price_per_night", property.PricePerNight);
            cmd.Parameters.AddWithValue("min_nights", property.MinNights);
            cmd.Parameters.AddWithValue("max_nights", property.MaxNights);
            cmd.Parameters.AddWithValue("check_in_time", property.CheckInTime);
            cmd.Parameters.AddWithValue("check_out_time", property.CheckOutTime);
            cmd.Parameters.AddWithValue("max_guests", property.MaxGuests);
            cmd.Parameters.AddWithValue("bathrooms", property.Bathrooms);
            cmd.Parameters.AddWithValue("kitchen", property.Kitchen);
            cmd.Parameters.AddWithValue("living_space", property.LivingSpace);
            cmd.Parameters.AddWithValue("pet_friendly", property.PetFriendly);
            cmd.Parameters.AddWithValue("smoke_detector", property.SmokeDetector);
            cmd.Parameters.AddWithValue("fire_extinguisher", property.FireExtinguisher);
            cmd.Parameters.AddWithValue("carbon_monoxide_detector", property.CarbonMonoxideDetector);
            cmd.Parameters.AddWithValue("lock_type", (object?)property.LockType ?? DBNull.Value);
            cmd.Parameters.AddWithValue("average_rating", property.AverageRating);
            cmd.Parameters.AddWithValue("review_count", property.ReviewCount);
            cmd.Parameters.AddWithValue("neighborhood_description", (object?)property.NeighborhoodDescription ?? DBNull.Value);
            cmd.Parameters.AddWithValue("tags", (object?)property.Tags?.ToArray() ?? DBNull.Value);
            cmd.Parameters.AddWithValue("instant_book", property.InstantBook);
            cmd.Parameters.AddWithValue("updated_at", property.UpdatedAt);

            return cmd.ExecuteNonQuery() > 0;
        }

        public bool DeletePropertyById(Guid propertyId)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_properties WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", propertyId);
            return cmd.ExecuteNonQuery() > 0;
        }


        public bool DeletePropertyPhoto(Guid photoId)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_property_photos WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", photoId);
            return cmd.ExecuteNonQuery() > 0;
        }


        public bool UpdateAmenity(Amenity amenity)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"UPDATE t_amenities SET code=@code, name=@name, category=@category WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", amenity.Id);
            cmd.Parameters.AddWithValue("code", amenity.Code);
            cmd.Parameters.AddWithValue("name", amenity.Name);
            cmd.Parameters.AddWithValue("category", (object?)amenity.Category ?? DBNull.Value);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool DeleteAmenity(Guid amenityId)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_amenities WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", amenityId);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool DeletePropertyAmenity(Guid id)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_property_amenities WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", id);
            return cmd.ExecuteNonQuery() > 0;
        }


        public bool UpdateActivity(Activity activity)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"UPDATE t_activities SET code=@code, name=@name, category=@category WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", activity.Id);
            cmd.Parameters.AddWithValue("code", activity.Code);
            cmd.Parameters.AddWithValue("name", activity.Name);
            cmd.Parameters.AddWithValue("category", (object?)activity.Category ?? DBNull.Value);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool DeleteActivity(Guid activityId)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_activities WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", activityId);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool DeletePropertyActivity(Guid id)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_property_activities WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", id);
            return cmd.ExecuteNonQuery() > 0;
        }


        public bool UpdateBooking(Booking booking)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"UPDATE t_bookings SET
            property_id=@property_id,
            user_id=@user_id,
            start_date=@start_date,
            end_date=@end_date,
            total_price=@total_price,
            status=@status,
            updated_at=@updated_at
          WHERE id=@id", conn);

            cmd.Parameters.AddWithValue("id", booking.Id);
            cmd.Parameters.AddWithValue("property_id", booking.PropertyId);
            cmd.Parameters.AddWithValue("user_id", booking.UserId);
            cmd.Parameters.AddWithValue("start_date", booking.StartDate);
            cmd.Parameters.AddWithValue("end_date", booking.EndDate);
            cmd.Parameters.AddWithValue("total_price", booking.TotalPrice);
            cmd.Parameters.AddWithValue("status", booking.Status);
            cmd.Parameters.AddWithValue("updated_at", booking.UpdatedAt);

            return cmd.ExecuteNonQuery() > 0;
        }

        public bool DeleteBooking(Guid bookingId)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_bookings WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", bookingId);
            return cmd.ExecuteNonQuery() > 0;
        }


        public bool UpdateReview(Review review)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"UPDATE t_reviews SET rating=@rating, comment=@comment WHERE id=@id", conn);

            cmd.Parameters.AddWithValue("id", review.Id);
            cmd.Parameters.AddWithValue("rating", review.Rating);
            cmd.Parameters.AddWithValue("comment", (object?)review.Comment ?? DBNull.Value);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool DeleteReview(Guid reviewId)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_reviews WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", reviewId);
            return cmd.ExecuteNonQuery() > 0;
        }


        public bool UpdateNotification(Notification notification)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"UPDATE t_notifications SET message=@message, read=@read WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", notification.Id);
            cmd.Parameters.AddWithValue("message", notification.Message);
            cmd.Parameters.AddWithValue("read", notification.Read);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool DeleteNotification(Guid notificationId)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_notifications WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", notificationId);
            return cmd.ExecuteNonQuery() > 0;
        }



        public bool UpdateQrCheckin(QrCheckin qr)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(
                @"UPDATE t_qr_checkin SET 
            checked_in=@checked_in,
            checked_out=@checked_out,
            updated_at=@updated_at
          WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", qr.Id);
            cmd.Parameters.AddWithValue("checked_in", qr.CheckedIn);
            cmd.Parameters.AddWithValue("checked_out", qr.CheckedOut);
            cmd.Parameters.AddWithValue("updated_at", qr.UpdatedAt);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool DeleteQrCheckin(Guid qrId)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand("DELETE FROM t_qr_checkin WHERE id=@id", conn);
            cmd.Parameters.AddWithValue("id", qrId);
            return cmd.ExecuteNonQuery() > 0;
        }

public void AddUserHistory(UserHistory history)
{
    using var conn = new NpgsqlConnection(_connectionString);
    conn.Open();
    var cmd = new NpgsqlCommand(
        @"INSERT INTO t_user_history
          (id, user_id, property_id, property_name, location, start_date, end_date, rating, created_at)
          VALUES (@id, @user_id, @property_id, @property_name, @location, @start_date, @end_date, @rating, @created_at)", conn);

    cmd.Parameters.AddWithValue("id", history.Id);
    cmd.Parameters.AddWithValue("user_id", history.UserId);
    cmd.Parameters.AddWithValue("property_id", history.PropertyId);
    cmd.Parameters.AddWithValue("property_name", history.PropertyName);
    cmd.Parameters.AddWithValue("location", (object?)history.Location ?? DBNull.Value);
    cmd.Parameters.AddWithValue("start_date", history.StartDate);
    cmd.Parameters.AddWithValue("end_date", history.EndDate);
    cmd.Parameters.AddWithValue("rating", (object?)history.Rating ?? DBNull.Value);
    cmd.Parameters.AddWithValue("created_at", history.CreatedAt);

    cmd.ExecuteNonQuery();
}


public List<UserHistory> GetUserHistory(Guid userId)
{
    var list = new List<UserHistory>();
    using var conn = new NpgsqlConnection(_connectionString);
    conn.Open();
    var cmd = new NpgsqlCommand(
        "SELECT id, user_id, property_id, property_name, location, start_date, end_date, rating, created_at FROM t_user_history WHERE user_id=@user_id ORDER BY start_date DESC", conn);
    cmd.Parameters.AddWithValue("user_id", userId);

    using var reader = cmd.ExecuteReader();
    while (reader.Read())
    {
        list.Add(new UserHistory
        {
            Id = reader.GetGuid(0),
            UserId = reader.GetGuid(1),
            PropertyId = reader.GetGuid(2),
            PropertyName = reader.GetString(3),
            Location = reader.IsDBNull(4) ? null : reader.GetString(4),
            StartDate = reader.GetDateTime(5),
            EndDate = reader.GetDateTime(6),
            Rating = reader.IsDBNull(7) ? null : reader.GetInt16(7),
            CreatedAt = reader.GetDateTime(8)
        });
    }
    return list;
}

public bool DeleteUserHistory(Guid id)
{
    using var conn = new NpgsqlConnection(_connectionString);
    conn.Open();
    var cmd = new NpgsqlCommand("DELETE FROM t_user_history WHERE id=@id", conn);
    cmd.Parameters.AddWithValue("id", id);
    return cmd.ExecuteNonQuery() > 0;
}

public void AddSession(Guid userId, string token, DateTime expiresAt)
{
    using var conn = new NpgsqlConnection(_connectionString);
    conn.Open();
    var cmd = new NpgsqlCommand(
        "INSERT INTO user_sessions (id, user_id, token, expires_at) VALUES (@id, @user_id, @token, @expires_at)", 
        conn);
    cmd.Parameters.AddWithValue("id", Guid.NewGuid());
    cmd.Parameters.AddWithValue("user_id", userId);
    cmd.Parameters.AddWithValue("token", token);
    cmd.Parameters.AddWithValue("expires_at", expiresAt);
    cmd.ExecuteNonQuery();
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
