import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = '/models';

export const loadModels = async () => {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
};

export const getDescriptor = async (videoEl) => {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection?.descriptor ?? null;
};

export const registerFace = (userId, descriptor) => {
  const users = JSON.parse(localStorage.getItem('face_users') || '{}');
  users[userId] = { descriptor: Array.from(descriptor) };
  localStorage.setItem('face_users', JSON.stringify(users));
};

export const verifyFace = async (userId, videoEl) => {
  const users = JSON.parse(localStorage.getItem('face_users') || '{}');
  if (!users[userId]) return { verified: false, reason: 'No face registered' };

  const descriptor = await getDescriptor(videoEl);
  if (!descriptor) return { verified: false, reason: 'No face detected' };

  const stored = new Float32Array(users[userId].descriptor);
  const distance = faceapi.euclideanDistance(stored, descriptor);
  return { verified: distance < 0.5, reason: distance < 0.5 ? 'OK' : 'Face does not match' };
};
