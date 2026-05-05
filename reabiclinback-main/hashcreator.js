const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function generateSalt(rounds = 10) {
  try {
    const salt = await bcrypt.genSalt(rounds);
    return salt;
  } catch (error) {
    console.error('Error generating salt:', error);
    throw error;
  }
}

function generateJWTSecret(length = 64) {
  return require('crypto').randomBytes(length).toString('hex');
}

async function main() {
  try {
    const salt = await generateSalt();
    console.log('Generated Salt:', salt);

    const jwtSecret = generateJWTSecret(64);
    console.log('Generated JWT Secret:', jwtSecret);

    // Exemplo de uso do segredo JWT com jsonwebtoken
    const payload = { userId: 123 };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

    console.log('Generated JWT:', token);

    // Verificação do token JWT
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Decoded JWT:', decoded);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
