import tls from 'node:tls'

function checkHost(hostname) {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: false,
    })

    socket.setTimeout(8000)

    socket.on('secureConnect', () => {
      const peerCertificate = socket.getPeerCertificate(true)
      const san = typeof peerCertificate.subjectaltname === 'string'
        ? peerCertificate.subjectaltname.split(', ').map((entry) => entry.replace(/^DNS:/, ''))
        : []

      resolve({
        hostname,
        ok: true,
        subject: peerCertificate.subject?.CN || null,
        issuer: peerCertificate.issuer?.CN || null,
        san,
      })
      socket.end()
    })

    socket.on('timeout', () => {
      resolve({
        hostname,
        ok: false,
        error: 'TLS timeout',
      })
      socket.destroy()
    })

    socket.on('error', (error) => {
      resolve({
        hostname,
        ok: false,
        error: error.message,
      })
    })
  })
}

async function main() {
  const hosts = process.argv.slice(2)
  if (!hosts.length) {
    console.error('Usage: node scripts/check-subdomain-tls.mjs <host> [host...]')
    process.exit(1)
  }

  const results = []
  for (const host of hosts) {
    results.push(await checkHost(host))
  }

  console.log(JSON.stringify(results, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exit(1)
})
