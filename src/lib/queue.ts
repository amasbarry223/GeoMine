/**
 * Queue system for async operations
 * Uses Bull/BullMQ for job processing (optional - only loads if bull is installed)
 */

let Queue: any = null;
try {
  Queue = require('bull');
} catch (e) {
  // Bull not installed, queue functions will return null
  console.debug('Bull not available, queue system disabled');
}

import { logInfo, logError } from './logger';

// Queue instances
let datasetImportQueue: any = null;
let inversionQueue: any = null;
let reportGenerationQueue: any = null;

/**
 * Initialize queues
 */
export function initializeQueues() {
  if (!Queue) {
    logInfo('Queue system not available (Bull not installed)');
    return;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    // Dataset import queue
    datasetImportQueue = new Queue('dataset-import', redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    // Inversion queue
    inversionQueue = new Queue('inversion', redisUrl, {
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 24 * 3600,
          count: 500,
        },
      },
    });

    // Report generation queue
    reportGenerationQueue = new Queue('report-generation', redisUrl, {
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: {
          age: 7 * 24 * 3600,
          count: 500,
        },
      },
    });

    // Event handlers
    datasetImportQueue.on('completed', (job) => {
      logInfo('Dataset import job completed', { jobId: job.id });
    });

    datasetImportQueue.on('failed', (job, err) => {
      logError('Dataset import job failed', err, { jobId: job?.id });
    });

    inversionQueue.on('completed', (job) => {
      logInfo('Inversion job completed', { jobId: job.id });
    });

    inversionQueue.on('failed', (job, err) => {
      logError('Inversion job failed', err, { jobId: job?.id });
    });

    reportGenerationQueue.on('completed', (job) => {
      logInfo('Report generation job completed', { jobId: job.id });
    });

    reportGenerationQueue.on('failed', (job, err) => {
      logError('Report generation job failed', err, { jobId: job?.id });
    });

    logInfo('Queues initialized', { redisUrl });
  } catch (error) {
    logError('Failed to initialize queues', error);
    // Fallback to in-memory processing if Redis is not available
  }
}

/**
 * Add dataset import job to queue
 */
export async function queueDatasetImport(data: {
  fileId: string;
  surveyLineId: string;
  userId: string;
  options: any;
}): Promise<any | null> {
  if (!Queue || !datasetImportQueue) {
    logInfo('Queue system not available, returning null');
    return null;
  }

  try {
    const job = await datasetImportQueue.add('import', data, {
      priority: 1,
    });
    logInfo('Dataset import job queued', { jobId: job.id });
    return job;
  } catch (error) {
    logError('Failed to queue dataset import', error);
    return null;
  }
}

/**
 * Add inversion job to queue
 */
export async function queueInversion(data: {
  datasetId: string;
  parameters: any;
  userId: string;
}): Promise<any | null> {
  if (!Queue || !inversionQueue) {
    logInfo('Queue system not available, returning null');
    return null;
  }

  try {
    const job = await inversionQueue.add('run', data, {
      priority: 2,
      timeout: 300000, // 5 minutes timeout
    });
    logInfo('Inversion job queued', { jobId: job.id });
    return job;
  } catch (error) {
    logError('Failed to queue inversion', error);
    return null;
  }
}

/**
 * Add report generation job to queue
 */
export async function queueReportGeneration(data: {
  projectId: string;
  templateType: string;
  includedModels: string[];
  userId: string;
}): Promise<any | null> {
  if (!Queue || !reportGenerationQueue) {
    logInfo('Queue system not available, returning null');
    return null;
  }

  try {
    const job = await reportGenerationQueue.add('generate', data, {
      priority: 3,
      timeout: 600000, // 10 minutes timeout
    });
    logInfo('Report generation job queued', { jobId: job.id });
    return job;
  } catch (error) {
    logError('Failed to queue report generation', error);
    return null;
  }
}

/**
 * Get job status
 */
export async function getJobStatus(queueName: string, jobId: string): Promise<any | null> {
  if (!Queue) {
    return null;
  }

  let queue: any = null;

  switch (queueName) {
    case 'dataset-import':
      queue = datasetImportQueue;
      break;
    case 'inversion':
      queue = inversionQueue;
      break;
    case 'report-generation':
      queue = reportGenerationQueue;
      break;
    default:
      return null;
  }

  if (!queue) {
    return null;
  }

  try {
    const job = await queue.getJob(jobId);
    return job;
  } catch (error) {
    logError('Failed to get job status', error);
    return null;
  }
}

/**
 * Cancel a job
 */
export async function cancelJob(queueName: string, jobId: string): Promise<boolean> {
  const job = await getJobStatus(queueName, jobId);
  if (!job) {
    return false;
  }

  try {
    await job.remove();
    logInfo('Job cancelled', { queueName, jobId });
    return true;
  } catch (error) {
    logError('Failed to cancel job', error);
    return false;
  }
}

// Initialize queues on module load (only in server environment)
if (typeof window === 'undefined') {
  initializeQueues();
}

