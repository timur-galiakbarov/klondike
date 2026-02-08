import React from 'react';
import Svg, { Defs, G, LinearGradient, Rect, Stop, Circle, Path } from 'react-native-svg';

export const SolitaireHero = () => (
  <Svg width="100%" height="100%" viewBox="0 0 400 400">
    <Defs>
      <LinearGradient id="burst" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#f4d35e" stopOpacity="0.35" />
        <Stop offset="1" stopColor="#f4d35e" stopOpacity="0" />
      </LinearGradient>
      <LinearGradient id="cardFront" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#ffffff" />
        <Stop offset="1" stopColor="#f7f3e8" />
      </LinearGradient>
      <LinearGradient id="cardBack" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#1b4634" />
        <Stop offset="1" stopColor="#0f2a1f" />
      </LinearGradient>
    </Defs>

    <Circle cx="210" cy="210" r="170" fill="url(#burst)" />

    <G transform="translate(30 210)">
      <Circle cx="20" cy="20" r="20" fill="#f4d35e" opacity="0.9" />
      <Circle cx="20" cy="20" r="12" fill="#e5c04c" />
    </G>
    <G transform="translate(320 250)">
      <Circle cx="18" cy="18" r="18" fill="#f4d35e" opacity="0.9" />
      <Circle cx="18" cy="18" r="10" fill="#e5c04c" />
    </G>

    <G transform="translate(60 160) rotate(-18 120 140)">
      <Rect x="0" y="20" width="200" height="280" rx="18" fill="url(#cardBack)" />
      <Rect x="16" y="36" width="168" height="248" rx="14" fill="#143525" opacity="0.9" />
      <Path
        d="M36 70h128v14H36zM36 106h128v14H36zM36 142h128v14H36zM36 178h128v14H36z"
        fill="rgba(255,255,255,0.14)"
      />
    </G>

    <G transform="translate(120 90) rotate(6 120 170)">
      <Rect x="0" y="20" width="200" height="280" rx="18" fill="url(#cardFront)" />
      <Rect x="12" y="32" width="176" height="256" rx="14" fill="rgba(15,42,31,0.06)" />
      <G transform="translate(24 52)">
        <Path
          d="M22 30c-10-12-26-6-26 10 0 18 24 32 26 34 2-2 26-16 26-34 0-16-16-22-26-10z"
          fill="#b0182b"
        />
      </G>
      <G transform="translate(134 210)">
        <Path
          d="M22 30c-10-12-26-6-26 10 0 18 24 32 26 34 2-2 26-16 26-34 0-16-16-22-26-10z"
          fill="#b0182b"
        />
      </G>
      <Path
        d="M150 80c-18 0-32 14-32 32 0 16 14 28 32 28 18 0 32-12 32-28 0-18-14-32-32-32z"
        fill="#b0182b"
        opacity="0.2"
      />
      <Path
        d="M96 128c-18-22-50-10-50 18 0 32 46 60 50 64 4-4 50-32 50-64 0-28-32-40-50-18z"
        fill="#b0182b"
      />
    </G>

    <G transform="translate(190 60) rotate(22 120 170)">
      <Rect x="0" y="20" width="200" height="280" rx="18" fill="url(#cardFront)" />
      <Rect x="12" y="32" width="176" height="256" rx="14" fill="rgba(15,42,31,0.06)" />
      <G transform="translate(24 50)">
        <Path
          d="M0 36c0-12 10-22 22-22 10 0 16 6 16 6s6-6 16-6c12 0 22 10 22 22 0 16-20 32-38 48-18-16-38-32-38-48z"
          fill="#1e1a14"
        />
      </G>
      <Path
        d="M110 150c-24 0-44 20-44 44 0 22 20 40 44 40 24 0 44-18 44-40 0-24-20-44-44-44z"
        fill="#1e1a14"
        opacity="0.15"
      />
      <Path
        d="M118 178l20 24-20 24-20-24 20-24z"
        fill="#1e1a14"
      />
    </G>

    <G transform="translate(280 90)">
      <Path
        d="M18 0l4 12h12l-10 7 4 12-10-7-10 7 4-12-10-7h12z"
        fill="#f4d35e"
      />
    </G>
  </Svg>
);
