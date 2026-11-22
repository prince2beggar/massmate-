import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { pollService } from '@/server/polls/poll-service';

export const GET = withTenantAuth(
  { permissions: ['notices.view', 'dashboard.view'] },
  async (req, { tenantContext, params }) => {
    const rawId = (params as any)?.id;
    const pollId = Array.isArray(rawId) ? rawId[0] : rawId || '';

    const poll = await pollService.getPollById(
      tenantContext.tenantSlug,
      pollId,
      true,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: poll,
    });
  }
);

export const PATCH = withTenantAuth(
  { permissions: ['notices.update', 'settings.manage'] },
  async (req, { tenantContext, params }) => {
    const rawId = (params as any)?.id;
    const pollId = Array.isArray(rawId) ? rawId[0] : rawId || '';
    const body = await req.json();

    if (body.action === 'PUBLISH') {
      const published = await pollService.publishPoll(
        tenantContext.tenantSlug,
        tenantContext.userId,
        pollId
      );
      return NextResponse.json({
        success: true,
        data: published,
        message: 'Poll has been published and community alerted.',
      });
    }

    if (body.action === 'CLOSE') {
      const closed = await pollService.closePoll(
        tenantContext.tenantSlug,
        tenantContext.userId,
        pollId
      );
      return NextResponse.json({
        success: true,
        data: closed,
        message: 'Poll has been closed and final results recorded.',
      });
    }

    if (body.action === 'CANCEL') {
      const cancelled = await pollService.cancelPoll(
        tenantContext.tenantSlug,
        tenantContext.userId,
        pollId,
        body.reason
      );
      return NextResponse.json({
        success: true,
        data: cancelled,
        message: 'Poll has been cancelled.',
      });
    }

    const updated = await pollService.updatePoll(
      tenantContext.tenantSlug,
      tenantContext.userId,
      pollId,
      body
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Poll updated successfully.',
    });
  }
);
