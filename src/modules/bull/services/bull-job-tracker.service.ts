import { Logger } from "@nestjs/common";
import { Injectable } from "@nestjs/common/decorators/core/injectable.decorator";

@Injectable()
export class BulkJobTrackerService {
  private readonly jobs = new Map<string, {
    total: number;
    completed: number;
    failed: number;
    startTime: Date;
    lastUpdate: Date;
    results: Array<{
      playerId?: number;
      playerName?: string;
      status: 'pending' | 'success' | 'failed';
      error?: string;
    }>;
  }>();

  constructor(private readonly logger: Logger) { }

  createJob(bulkJobId: string, totalPlayers: number) {
    this.jobs.set(bulkJobId, {
      total: totalPlayers,
      completed: 0,
      failed: 0,
      startTime: new Date(),
      lastUpdate: new Date(),
      results: Array(totalPlayers).fill(null).map(() => ({
        status: 'pending'
      }))
    });
    this.logger.log(`Created bulk job tracking for ${bulkJobId}`);
  }

  updateJobSuccess(bulkJobId: string, playerIndex: number, playerId: number, playerName: string) {
    const job = this.jobs.get(bulkJobId);
    if (!job) return;

    job.results[playerIndex] = {
      playerId,
      playerName,
      status: 'success'
    };
    job.completed++;
    job.lastUpdate = new Date();
  }

  updateJobFailure(bulkJobId: string, playerIndex: number, error: string, playerName?: string) {
    const job = this.jobs.get(bulkJobId);
    if (!job) return;

    job.results[playerIndex] = {
      playerName,
      status: 'failed',
      error
    };
    job.failed++;
    job.lastUpdate = new Date();
  }

  getJobStatus(bulkJobId: string) {
    const job = this.jobs.get(bulkJobId);
    if (!job) return null;

    return {
      bulkJobId,
      status: job.completed + job.failed === job.total ? 'completed' : 'processing',
      startTime: job.startTime,
      lastUpdate: job.lastUpdate,
      progress: {
        total: job.total,
        completed: job.completed,
        failed: job.failed,
        remaining: job.total - job.completed - job.failed
      },
      results: job.results
    };
  }
}