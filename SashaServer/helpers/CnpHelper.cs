using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace SashaServer.Helpers
{
    public class CnpHelper
    {
        private readonly string _key;

        public CnpHelper(string key)
        {
            if (string.IsNullOrEmpty(key))
                throw new InvalidOperationException("CNP key not configured.");
            
            _key = key;
        }

        public string EncryptCnp(string cnp)
        {
            if (string.IsNullOrEmpty(cnp))
                return string.Empty;

            using var aes = Aes.Create();
            aes.Key = Encoding.UTF8.GetBytes(_key.PadRight(32).Substring(0, 32));
            aes.GenerateIV();

            using var encryptor = aes.CreateEncryptor();
            var plainBytes = Encoding.UTF8.GetBytes(cnp);
            var encryptedBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

            var result = new byte[aes.IV.Length + encryptedBytes.Length];
            Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
            Buffer.BlockCopy(encryptedBytes, 0, result, aes.IV.Length, encryptedBytes.Length);

            return Convert.ToBase64String(result);
        }

        public string DecryptCnp(string encryptedCnp)
        {
            if (string.IsNullOrEmpty(encryptedCnp))
                return string.Empty;

            var fullCipher = Convert.FromBase64String(encryptedCnp);

            using var aes = Aes.Create();
            aes.Key = Encoding.UTF8.GetBytes(_key.PadRight(32).Substring(0, 32));

            var iv = new byte[aes.BlockSize / 8];
            var cipher = new byte[fullCipher.Length - iv.Length];

            Buffer.BlockCopy(fullCipher, 0, iv, 0, iv.Length);
            Buffer.BlockCopy(fullCipher, iv.Length, cipher, 0, cipher.Length);

            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor();
            var plainBytes = decryptor.TransformFinalBlock(cipher, 0, cipher.Length);

            return Encoding.UTF8.GetString(plainBytes);
        }

        public string MaskCnp(string cnp)
        {
            if (string.IsNullOrEmpty(cnp) || cnp.Length < 8)
                return cnp;

            return cnp.Substring(0, 4) + "****" + cnp.Substring(cnp.Length - 4);
        }
    }
}
