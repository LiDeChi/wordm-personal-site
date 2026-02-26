#!/usr/bin/env node
import { promises as fs } from 'node:fs'
import path from 'node:path'

const filePath = process.env.AUTH_ROLE_RULES_PATH
  ? path.resolve(process.cwd(), process.env.AUTH_ROLE_RULES_PATH)
  : path.resolve(process.cwd(), 'public/auth-role-rules.json')

const DEFAULT_RULES = {
  adminEmails: [],
  testerEmails: [],
}

const ROLE_KEY_MAP = {
  admin: 'adminEmails',
  tester: 'testerEmails',
  test: 'testerEmails',
}

function printUsage() {
  console.log(`Usage:
  npm run roles -- list
  npm run roles -- add <admin|tester> <email> [email...]
  npm run roles -- remove <admin|tester> <email> [email...]
  npm run roles -- set <admin|tester> <email,email,...>
  npm run roles -- clear <admin|tester>

Optional:
  AUTH_ROLE_RULES_PATH=path/to/auth-role-rules.json npm run roles -- list
`)
}

function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  if (!email) {
    return ''
  }

  if (!email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
    throw new Error(`Invalid email: ${value}`)
  }

  return email
}

function toUniqueSortedList(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

async function readRules() {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      adminEmails: Array.isArray(parsed.adminEmails) ? parsed.adminEmails.map(normalizeEmail).filter(Boolean) : [],
      testerEmails: Array.isArray(parsed.testerEmails) ? parsed.testerEmails.map(normalizeEmail).filter(Boolean) : [],
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return { ...DEFAULT_RULES }
    }
    throw error
  }
}

async function writeRules(rules) {
  const normalized = {
    adminEmails: toUniqueSortedList(rules.adminEmails.map(normalizeEmail).filter(Boolean)),
    testerEmails: toUniqueSortedList(rules.testerEmails.map(normalizeEmail).filter(Boolean)),
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
  return normalized
}

function resolveRoleKey(roleInput) {
  const role = String(roleInput ?? '').trim().toLowerCase()
  const key = ROLE_KEY_MAP[role]
  if (!key) {
    throw new Error(`Invalid role: ${roleInput}. Use admin or tester.`)
  }
  return key
}

function parseEmailArgs(args) {
  return args
    .flatMap((item) => String(item).split(','))
    .map((value) => normalizeEmail(value))
    .filter(Boolean)
}

function printRules(rules) {
  const output = {
    filePath,
    adminEmails: toUniqueSortedList(rules.adminEmails),
    testerEmails: toUniqueSortedList(rules.testerEmails),
  }
  console.log(JSON.stringify(output, null, 2))
}

async function run() {
  const [, , command, ...rest] = process.argv

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printUsage()
    process.exit(0)
  }

  const rules = await readRules()

  if (command === 'list') {
    printRules(rules)
    return
  }

  if (command === 'add') {
    const [roleInput, ...emailArgs] = rest
    if (!roleInput || emailArgs.length === 0) {
      throw new Error('add requires role and at least one email.')
    }
    const roleKey = resolveRoleKey(roleInput)
    const incoming = parseEmailArgs(emailArgs)
    const next = {
      ...rules,
      [roleKey]: toUniqueSortedList([...rules[roleKey], ...incoming]),
    }
    const written = await writeRules(next)
    printRules(written)
    return
  }

  if (command === 'remove') {
    const [roleInput, ...emailArgs] = rest
    if (!roleInput || emailArgs.length === 0) {
      throw new Error('remove requires role and at least one email.')
    }
    const roleKey = resolveRoleKey(roleInput)
    const removing = new Set(parseEmailArgs(emailArgs))
    const next = {
      ...rules,
      [roleKey]: rules[roleKey].filter((email) => !removing.has(email)),
    }
    const written = await writeRules(next)
    printRules(written)
    return
  }

  if (command === 'set') {
    const [roleInput, ...emailArgs] = rest
    if (!roleInput) {
      throw new Error('set requires role and optional email list.')
    }
    const roleKey = resolveRoleKey(roleInput)
    const nextEmails = parseEmailArgs(emailArgs)
    const next = {
      ...rules,
      [roleKey]: toUniqueSortedList(nextEmails),
    }
    const written = await writeRules(next)
    printRules(written)
    return
  }

  if (command === 'clear') {
    const [roleInput] = rest
    if (!roleInput) {
      throw new Error('clear requires role.')
    }
    const roleKey = resolveRoleKey(roleInput)
    const next = {
      ...rules,
      [roleKey]: [],
    }
    const written = await writeRules(next)
    printRules(written)
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

run().catch((error) => {
  console.error(`manage-auth-roles failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
