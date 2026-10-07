const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000';

const ACCESS_TOKEN_KEYS = [
  'mealbridge_access_token',
  'access_token',
  'mealbridge_token',
  'token',
];


// =========================================================
// GET TOKEN
// Check both localStorage and sessionStorage
// =========================================================

function getToken() {
  for (const key of ACCESS_TOKEN_KEYS) {
    const localToken =
      localStorage.getItem(key);

    if (localToken) {
      return localToken;
    }

    const sessionToken =
      sessionStorage.getItem(key);

    if (sessionToken) {
      return sessionToken;
    }
  }

  return null;
}


// =========================================================
// BUILD URL
// =========================================================

function buildUrl(url) {
  if (!url) {
    return API_BASE_URL;
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }

  return `${API_BASE_URL}/${url}`;
}


// =========================================================
// PARSE RESPONSE
// =========================================================

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';

  if (
    contentType.includes(
      'application/json'
    )
  ) {
    return response.json();
  }

  return response.text();
}


// =========================================================
// COMMON REQUEST
// =========================================================

async function request(
  url,
  options = {}
) {
  const token = getToken();

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };


  // Add JWT token
  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  // Do not set JSON content type for
  // FormData or URLSearchParams
  const isFormBody =
    options.body instanceof FormData ||
    options.body instanceof URLSearchParams;


  if (
    options.body !== undefined &&
    !isFormBody &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] =
      'application/json';
  }


  let response;

  try {
    response = await fetch(
      buildUrl(url),
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    const networkError =
      new Error(
        'Unable to connect to MealBridge backend. Make sure FastAPI is running on http://127.0.0.1:8000.'
      );

    networkError.cause =
      error;

    throw networkError;
  }


  const data =
    await parseResponse(
      response
    );


  // =======================================================
  // HANDLE HTTP ERRORS
  // =======================================================

  if (!response.ok) {

    let message =
      `Request failed with status ${response.status}`;


    if (data) {

      if (
        typeof data === 'string'
      ) {
        message = data;
      }

      else if (data.detail) {
        message =
          typeof data.detail ===
          'string'
            ? data.detail
            : JSON.stringify(
                data.detail
              );
      }

      else if (data.message) {
        message =
          data.message;
      }
    }


    const error =
      new Error(message);


    error.response = {
      status:
        response.status,

      data,
    };


    throw error;
  }


  // IMPORTANT:
  // Return API JSON directly
  return data;
}


// =========================================================
// GET
// =========================================================

async function get(
  url,
  config = {}
) {
  return request(
    url,
    {
      method: 'GET',
      ...config,
    }
  );
}


// =========================================================
// POST JSON
// =========================================================

async function post(
  url,
  data = {},
  config = {}
) {
  return request(
    url,
    {
      method: 'POST',
      ...config,
      body: JSON.stringify(
        data
      ),
    }
  );
}


// =========================================================
// POST FORM
// FastAPI OAuth2 login
// =========================================================

async function postForm(
  url,
  data,
  config = {}
) {
  let body = data;


  if (
    !(data instanceof FormData) &&
    !(data instanceof URLSearchParams)
  ) {

    body =
      new URLSearchParams();


    Object.entries(
      data || {}
    ).forEach(
      ([key, value]) => {

        body.append(
          key,
          value ?? ''
        );

      }
    );
  }


  return request(
    url,
    {
      method: 'POST',

      ...config,

      body,

      headers: {
        ...(config.headers || {}),

        'Content-Type':
          'application/x-www-form-urlencoded',
      },
    }
  );
}


// =========================================================
// PUT
// =========================================================

async function put(
  url,
  data = {},
  config = {}
) {
  return request(
    url,
    {
      method: 'PUT',
      ...config,
      body: JSON.stringify(
        data
      ),
    }
  );
}


// =========================================================
// PATCH
// =========================================================

async function patch(
  url,
  data = {},
  config = {}
) {
  return request(
    url,
    {
      method: 'PATCH',
      ...config,
      body: JSON.stringify(
        data
      ),
    }
  );
}


// =========================================================
// DELETE
// =========================================================

async function deleteRequest(
  url,
  config = {}
) {
  return request(
    url,
    {
      method: 'DELETE',
      ...config,
    }
  );
}


// =========================================================
// API CLIENT
// =========================================================

const apiClient = {
  get,
  post,
  postForm,
  put,
  patch,
  delete:
    deleteRequest,
};


// =========================================================
// EXPORTS
// =========================================================

export default apiClient;

export {
  apiClient,
  get,
  post,
  postForm,
  put,
  patch,
  deleteRequest,
};