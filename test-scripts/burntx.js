// const { useState } = require("react");

const useFetch = (url, options) => {
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
  
    const controller = new AbortController()
    const signal = controller.signal
  
    useEffect(() => {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(url, {...options, signal});
          const result = await res.json();
          setResponse(result);
          setIsLoading(false)
        } catch (error) {
          setError(error);
        }
      };
      fetchData();
    }, []);
    return { response, error, isLoading, signal };
  };

useFetch("https://jsonplaceholder.typicode.com/posts/1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Test",
      body: "I am testing!",
      userId: 1,
    }),
  })
    .then((response) => response.json())
    .then((data) => console.log(data))