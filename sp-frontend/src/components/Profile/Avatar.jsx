import React from 'react';

const Avatar = ({ username, size = 100 }) => {
  return (
    <img
      src={`https://minotar.net/helm/${username}/${size}.png`}
      alt={`${username}'s avatar`}
      className="profile-avatar"
      width={size}
      height={size}
    />
  );
};

export default Avatar; 