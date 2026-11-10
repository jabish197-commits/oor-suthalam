import { useCallback, useEffect, useRef, useState } from 'react';

export default function useResource(loader, key = '', { keepPreviousData = false } = {}) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: '',
    refreshing: false,
  });

  useEffect(() => {
    let active = true;

    setState((previous) =>
      keepPreviousData && previous.data !== null
        ? { ...previous, loading: false, refreshing: true, error: '' }
        : { data: null, loading: true, refreshing: false, error: '' },
    );

    Promise.resolve()
      .then(() => loaderRef.current())
      .then((data) => {
        if (active) setState({ data, loading: false, refreshing: false, error: '' });
      })
      .catch((error) => {
        if (active) {
          setState({
            data: null,
            loading: false,
            refreshing: false,
            error: error.message,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [key, version, keepPreviousData]);

  return {
    ...state,
    reload,
  };
}
