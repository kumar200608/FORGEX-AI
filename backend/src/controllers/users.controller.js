const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../utils/response.util');

const searchUsers = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return sendError(res, 'Email/query parameter is required', 400);
    }

    const query = String(email).trim();

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            email: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        publicKey: true
      },
      take: 10
    });

    return sendSuccess(res, users);
  } catch (error) {
    console.error('Failed to search users:', error);
    return sendError(res, 'Failed to search users', 500);
  }
};

module.exports = { searchUsers };
