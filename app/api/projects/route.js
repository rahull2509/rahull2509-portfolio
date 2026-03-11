import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '../../../src/lib/auth';

const DATA_PATH = path.join(process.cwd(), 'data', 'projects.json');

function readProjects() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeProjects(projects) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(projects, null, 2), 'utf-8');
}

function isAuthenticated(request) {
  const token = request.cookies.get('ks_token')?.value;
  if (!token) return false;
  return !!verifyToken(token);
}

// GET — public, return all projects
export async function GET() {
  const projects = readProjects();
  return NextResponse.json(projects);
}

// POST — add project (auth required)
export async function POST(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const project = await request.json();
    const projects = readProjects();
    const newProject = {
      ...project,
      id: Date.now().toString(),
      excalidrawScene: null,
    };
    projects.unshift(newProject);
    writeProjects(projects);
    return NextResponse.json(newProject, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

// PUT — update project (auth required)
export async function PUT(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, ...updates } = await request.json();
    const projects = readProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    projects[index] = { ...projects[index], ...updates };
    writeProjects(projects);
    return NextResponse.json(projects[index]);
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

// DELETE — delete project (auth required)
export async function DELETE(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const projects = readProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  writeProjects(filtered);
  return NextResponse.json({ success: true });
}
