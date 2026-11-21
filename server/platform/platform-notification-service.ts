import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import type { NotificationType } from '@/types/database';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export class PlatformNotificationService {
  private db: any;
  private isCustomDb: boolean;

  constructor(customDb?: any) {
    this.db = customDb || prisma;
    this.isCustomDb = !!customDb;
  }

  /**
   * Lists notifications for platform staff.
   */
  async listNotifications(userId?: string, limit: number = 20): Promise<{
    notifications: NotificationDto[];
    unreadCount: number;
  }> {
    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        return { notifications: [], unreadCount: 0 };
      }
    }

    const where: any = {
      OR: [{ userId: null }, ...(userId ? [{ userId }] : [])],
    };

    const [unreadCount, rawNotifications] = await Promise.all([
      this.db.platformNotification.count({
        where: { ...where, isRead: false },
      }),
      this.db.platformNotification.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const notifications: NotificationDto[] = (rawNotifications || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      isRead: n.isRead,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    }));

    return { notifications, unreadCount };
  }

  /**
   * Marks a single notification as read.
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    await this.db.platformNotification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
    return true;
  }

  /**
   * Marks all notifications as read.
   */
  async markAllAsRead(userId?: string): Promise<number> {
    const where: any = {
      isRead: false,
      OR: [{ userId: null }, ...(userId ? [{ userId }] : [])],
    };
    const result = await this.db.platformNotification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    });
    return result.count;
  }

  /**
   * Creates a system notification event.
   */
  async createNotification(data: {
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
    userId?: string;
  }): Promise<NotificationDto> {
    const n = await this.db.platformNotification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || null,
        metadata: data.metadata || null,
        userId: data.userId || null,
      },
    });

    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      isRead: n.isRead,
      readAt: null,
      createdAt: n.createdAt.toISOString(),
    };
  }
}

export const platformNotificationService = new PlatformNotificationService();
