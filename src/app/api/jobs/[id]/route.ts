import { NextRequest, NextResponse } from 'next/server';
import { getJobStatus, cancelJob } from '@/lib/queue';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';

/**
 * GET /api/jobs/[id] - Get job status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    const { searchParams } = new URL(request.url);
    const queueName = searchParams.get('queue') || 'dataset-import';

    const job = await getJobStatus(queueName, params.id);

    if (!job) {
      return createErrorResponse('Job non trouvé', 404);
    }

    const jobData = {
      id: job.id,
      name: job.name,
      data: job.data,
      opts: job.opts,
      progress: job.progress(),
      state: await job.getState(),
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      failedReason: job.failedReason,
    };

    return createSuccessResponse(jobData);
  } catch (error) {
    return createErrorResponse('Erreur lors de la récupération du job', 500);
  }
}

/**
 * DELETE /api/jobs/[id] - Cancel a job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    const { searchParams } = new URL(request.url);
    const queueName = searchParams.get('queue') || 'dataset-import';

    const cancelled = await cancelJob(queueName, params.id);

    if (!cancelled) {
      return createErrorResponse('Job non trouvé ou ne peut pas être annulé', 404);
    }

    return createSuccessResponse({ id: params.id }, 'Job annulé avec succès');
  } catch (error) {
    return createErrorResponse('Erreur lors de l\'annulation du job', 500);
  }
}


