// Only allow fixed messages out of the driver error, never its raw URI or stack.
export function databaseErrorMessage(error) {
  const errors = [...(error?.reason?.servers?.values() ?? [])].map(
    (server) => server.error,
  );
  if (error?.syscall === 'querySrv' || error?.syscall === 'queryTxt') {
    return 'Atlas DNS lookup failed. Check your resolver or MONGO_DNS_SERVERS.';
  }
  if (
    errors.some((value) => /alert.*80|alert internal error/i.test(value?.message ?? ''))
  ) {
    return 'TLS alert 80. Check the Atlas IP access list, cluster availability, and network TLS inspection.';
  }
  if (
    errors.some((value) =>
      [
        'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
        'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
        'SELF_SIGNED_CERT_IN_CHAIN',
      ].includes(value?.cause?.code),
    )
  ) {
    return 'Certificate-chain verification failed. Use the startup commands with system CA trust.';
  }
  if (error?.code === 18)
    return 'MongoDB authentication failed. Verify the database user and URI locally.';
  return 'Database connection failed. Check the Atlas configuration and network. Credentials have been suppressed.';
}
