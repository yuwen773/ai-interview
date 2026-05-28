package interview.guide.modules.llmprovider.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class ApiKeyEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final SecretKey secretKey;

    public record EncryptedValue(String nonce, String ciphertext) {}

    public ApiKeyEncryptionService(
            @Value("${app.ai.security.api-key-encryption-key:}") String encryptionKey) {
        if (encryptionKey == null || encryptionKey.isBlank()) {
            encryptionKey = "default-dev-key-32-bytes-long!!";
        }
        this.secretKey = new SecretKeySpec(encryptionKey.getBytes(), "AES");
    }

    public EncryptedValue encrypt(String plainText) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(plainText.getBytes());

            return new EncryptedValue(
                Base64.getEncoder().encodeToString(iv),
                Base64.getEncoder().encodeToString(cipherText)
            );
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PROVIDER_CONFIG_WRITE_FAILED, "加密失败: " + e.getMessage());
        }
    }

    public String decrypt(String nonce, String ciphertext) {
        try {
            byte[] iv = Base64.getDecoder().decode(nonce);
            byte[] cipherText = Base64.getDecoder().decode(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] plainText = cipher.doFinal(cipherText);
            return new String(plainText);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PROVIDER_CONFIG_READ_FAILED, "解密失败: " + e.getMessage());
        }
    }
}