/**
 * @swagger
 * /sign-up:
 *   post:
 *     summary: Sign up a user
 *     tags:
 *       - Login Module
 *     requestBody:
 *       description: User sign up data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailId:
 *                 type: string
 *               password:
 *                 type: string
 *               userType:
 *                 type: string
 *               accountType:
 *                 type: string
 *               companyName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               isAcceptedTerms:
 *                 type: boolean
 *               onboardingStatus:
 *                 type: string
 *               plan:
 *                 type: string
 *             example:
 *               emailId: john@example.com
 *               password: password123
 *               userType: admin
 *               accountType: premium
 *               companyName: Acme Corp
 *               phoneNumber: +1 555-555-5555
 *               isAcceptedTerms: true
 *               onboardingStatus: completed
 *               plan: premium
 *     responses:
 *       '200':
 *         description: User signed up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *               example:
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbElkIjoiam9obi5leGFtcGxlLmNvbSIsImlkIjoiNWJhMzFjZmQ2ZjQ2ZTQ2YWE1OTYyMzlkIiwiaWF0IjoxNTE2MjM5MDIyfQ.Xk-gWyTtYRfAeRDejtfwTtLnFq3iDvOjL9uvDTAtBZ8
 *       '400':
 *         description: Invalid request body or invalid email/password format
 *       '409':
 *         description: Email already exists
 *       '500':
 *         description: Internal server error
 */