import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// Flag to track sign-in in progress
let isSigningIn = false;
// In-memory token cache (NEVER persisted to localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
} | null = null;

// Initialize Google Workspace Auth state
export const initWorkspaceAuth = (
  onSuccess?: (user: FirebaseUser, token: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user && cachedAccessToken) {
      cachedGoogleUser = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid,
      };
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      if (!user) {
        cachedAccessToken = null;
        cachedGoogleUser = null;
      }
      if (onFailure) onFailure();
    }
  });
};

export const getWorkspaceAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCachedGoogleUser = () => {
  return cachedGoogleUser;
};

// Sign in with Google Popup
export const signInWithGoogleWorkspace = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('Could not retrieve access token from Google sign-in.');
    }

    cachedAccessToken = token;
    cachedGoogleUser = {
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
      uid: result.user.uid,
    };

    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error('Google Workspace Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const signOutGoogleWorkspace = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
    cachedGoogleUser = null;
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

// ==========================================
// GOOGLE DRIVE API CLIENT
// ==========================================

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
}

export const fetchDriveFiles = async (
  accessToken: string,
  query: string = '',
  pageSize: number = 25
): Promise<{ files: DriveFileItem[]; nextPageToken?: string }> => {
  let q = "trashed = false";
  if (query.trim()) {
    q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
  }

  const params = new URLSearchParams({
    q,
    pageSize: String(pageSize),
    fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents)',
    orderBy: 'modifiedTime desc',
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to load Drive files: ${res.statusText}`);
  }

  return await res.json();
};

export const createDriveFolder = async (
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<DriveFileItem> => {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to create folder: ${res.statusText}`);
  }

  return await res.json();
};

export const uploadTextFileToDrive = async (
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/plain',
  parentFolderId?: string
): Promise<DriveFileItem> => {
  const metadata: any = {
    name: fileName,
    mimeType,
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size,modifiedTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to upload file to Drive: ${res.statusText}`);
  }

  return await res.json();
};

export const deleteDriveFile = async (accessToken: string, fileId: string): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to delete Drive file: ${res.statusText}`);
  }
};

// ==========================================
// GMAIL API CLIENT
// ==========================================

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  labelIds?: string[];
  unread?: boolean;
}

export interface GmailMessageDetail extends GmailMessageSummary {
  bodyText?: string;
  bodyHtml?: string;
}

export const fetchGmailMessages = async (
  accessToken: string,
  query: string = '',
  maxResults: number = 20
): Promise<GmailMessageSummary[]> => {
  const params = new URLSearchParams({
    maxResults: String(maxResults),
  });
  if (query.trim()) {
    params.append('q', query);
  }

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!listRes.ok) {
    const errData = await listRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch messages: ${listRes.statusText}`);
  }

  const listData = await listRes.json();
  if (!listData.messages || listData.messages.length === 0) {
    return [];
  }

  // Fetch headers & snippet for each message in parallel
  const detailPromises = listData.messages.slice(0, 15).map(async (msgItem: { id: string }) => {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgItem.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!msgRes.ok) return null;
      const data = await msgRes.json();

      const headers: Record<string, string> = {};
      data.payload?.headers?.forEach((h: { name: string; value: string }) => {
        headers[h.name.toLowerCase()] = h.value;
      });

      const summary: GmailMessageSummary = {
        id: data.id,
        threadId: data.threadId,
        snippet: data.snippet,
        subject: headers['subject'] || '(No Subject)',
        from: headers['from'] || 'Unknown Sender',
        to: headers['to'] || '',
        date: headers['date'] || '',
        labelIds: data.labelIds || [],
        unread: data.labelIds?.includes('UNREAD'),
      };
      return summary;
    } catch (e) {
      return null;
    }
  });

  const results = await Promise.all(detailPromises);
  return results.filter((r): r is GmailMessageSummary => r !== null);
};

export const fetchGmailMessageDetail = async (
  accessToken: string,
  messageId: string
): Promise<GmailMessageDetail> => {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch email details: ${res.statusText}`);
  }

  const data = await res.json();
  const headers: Record<string, string> = {};
  data.payload?.headers?.forEach((h: { name: string; value: string }) => {
    headers[h.name.toLowerCase()] = h.value;
  });

  let bodyText = '';
  let bodyHtml = '';

  const extractBody = (part: any) => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText = decodeBase64Url(part.body.data);
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = decodeBase64Url(part.body.data);
    }
    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(extractBody);
    }
  };

  if (data.payload) {
    if (data.payload.body?.data) {
      const decoded = decodeBase64Url(data.payload.body.data);
      if (data.payload.mimeType === 'text/html') {
        bodyHtml = decoded;
      } else {
        bodyText = decoded;
      }
    }
    if (data.payload.parts) {
      data.payload.parts.forEach(extractBody);
    }
  }

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet,
    subject: headers['subject'] || '(No Subject)',
    from: headers['from'] || 'Unknown Sender',
    to: headers['to'] || '',
    date: headers['date'] || '',
    labelIds: data.labelIds || [],
    unread: data.labelIds?.includes('UNREAD'),
    bodyText: bodyText || data.snippet,
    bodyHtml: bodyHtml || undefined,
  };
};

export const sendGmailEmail = async (
  accessToken: string,
  to: string,
  subject: string,
  bodyContent: string,
  isHtml: boolean = false
): Promise<{ id: string; threadId: string }> => {
  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8`,
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyContent,
  ];

  const rawEmail = emailLines.join('\r\n');
  const encodedEmail = encodeBase64Url(rawEmail);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedEmail }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to send email: ${res.statusText}`);
  }

  return await res.json();
};

export const deleteGmailMessage = async (
  accessToken: string,
  messageId: string
): Promise<void> => {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to move email to trash: ${res.statusText}`);
  }
};

// Utilities for Base64URL encoding/decoding
function decodeBase64Url(base64Url: string): string {
  try {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    return atob(base64Url.replace(/-/g, '+').replace(/_/g, '/'));
  }
}

function encodeBase64Url(str: string): string {
  const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8Bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
