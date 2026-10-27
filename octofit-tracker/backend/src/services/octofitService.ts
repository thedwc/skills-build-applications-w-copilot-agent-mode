import { isValidObjectId } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: string;
    teamId?: string;
    type?: string;
    minutes?: number | string;
  };

  if (!isValidObjectId(userId) || !isValidObjectId(teamId)) {
    throw Object.assign(new Error('User and team IDs must be valid ObjectIds'), { status: 400 });
  }

  const userExists = await User.exists({ _id: userId });
  const teamExists = await Team.exists({ _id: teamId });
  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Referenced user or team does not exist'), { status: 404 });
  }

  if (typeof type !== 'string' || !type.trim()) {
    throw Object.assign(new Error('Activity type is required'), { status: 400 });
  }

  const numericMinutes = Number(minutes);
  if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) {
    throw Object.assign(new Error('Activity minutes must be a positive number'), { status: 400 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes: numericMinutes,
    points: numericMinutes,
    occurredAt: new Date(),
  });

  return activity;
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const { name, mascot, members } = input as {
    name?: string;
    mascot?: string;
    members?: Array<string | { toString(): string }>;
  };

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  const validatedMembers = Array.isArray(members)
    ? members.filter((member): member is string | { toString(): string } => member !== undefined && member !== null)
    : [];

  const normalizedMembers = validatedMembers
    .map((member) => String(member))
    .filter((member) => isValidObjectId(member));

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: normalizedMembers,
  });

  return team;
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    {
      $unwind: '$team',
    },
    {
      $project: {
        _id: 0,
        teamName: '$team.name',
        totalPoints: 1,
      },
    },
    {
      $sort: { totalPoints: -1, teamName: 1 },
    },
  ]);

  return rows.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const preferredFocus = user.fitnessGoal ?? recentActivity?.type ?? undefined;

  const workouts = await Workout.find().lean();
  if (!workouts.length) {
    return [];
  }

  const ranked = [...workouts].sort((a, b) => {
    const aScore = a.focus === preferredFocus ? 2 : a.focus === recentActivity?.type ? 1 : 0;
    const bScore = b.focus === preferredFocus ? 2 : b.focus === recentActivity?.type ? 1 : 0;
    return bScore - aScore;
  });

  return ranked.map((workout, index) => ({
    ...workout,
    reason: index === 0
      ? `This recommendation matches ${user.fitnessGoal ?? 'your recent activity'} and supports ${recentActivity?.type ?? user.fitnessGoal ?? 'your goals'}.`
      : `This complements your ${user.fitnessGoal ?? 'recent activity'} focus.`,
  }));
}

export { User };
