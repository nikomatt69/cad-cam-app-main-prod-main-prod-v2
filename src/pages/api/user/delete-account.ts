import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, Prisma } from '@prisma/client';
import { requireAuth } from '@/src/lib/api/auth';
// Adjusted path based on typical structure

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const userId = await requireAuth(req, res);
  if (!userId) return;
  
  
 
  try {
    // Use a transaction to ensure all related data is deleted or none is
    await prisma.$transaction(async (tx) => {
      // --- Explicitly delete related data without onDelete: Cascade ---
      // Delete owned Projects
      await tx.project.deleteMany({ where: { ownerId: userId } });

      // Delete owned Materials
      await tx.material.deleteMany({ where: { ownerId: userId } });

      // Delete owned Tools
      await tx.tool.deleteMany({ where: { ownerId: userId } });

      // Delete owned MachineConfigs
      await tx.machineConfig.deleteMany({ where: { ownerId: userId } });

      // Delete ActivityLogs
      await tx.activityLog.deleteMany({ where: { userId: userId } });

      // Delete AIAnalysisLogs
      await tx.aIAnalysisLog.deleteMany({ where: { userId: userId } });

      // Delete owned LibraryItems
      await tx.libraryItem.deleteMany({ where: { ownerId: userId } });

      // Delete ComponentVersions created by user
      await tx.componentVersion.deleteMany({ where: { userId: userId } });

      // Delete ComponentComments by user
      await tx.componentComment.deleteMany({ where: { userId: userId } });

      // Delete Toolpaths created by user
      await tx.toolpath.deleteMany({ where: { createdBy: userId } });

      // Delete ToolpathVersions by user
      await tx.toolpathVersion.deleteMany({ where: { userId: userId } });

      // Delete ToolpathComments by user
      await tx.toolpathComment.deleteMany({ where: { userId: userId } });

      // --- Delete the User ---
      // Prisma will automatically handle cascading deletes for models with onDelete: Cascade
      // (e.g., Account, Session, UserOrganization, Subscription, Notification, etc.)
      await tx.user.delete({
        where: {
          id: userId,
        },
      });
    });

    console.log(`Successfully deleted account and associated data for user ID: ${userId}`);
    return res.status(200).json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Account deletion failed:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: Record to delete not found. Might happen in race conditions.
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'User not found or already deleted' });
      }
      // Handle other potential Prisma errors during deletion
      return res.status(500).json({ message: `Database error: ${error.message}` });
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return res.status(500).json({ message: `Unknown database error: ${error.message}` });
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      return res.status(400).json({ message: `Validation error: ${error.message}` });
    }

    return res.status(500).json({ message: 'Internal server error during account deletion' });
  }
}
