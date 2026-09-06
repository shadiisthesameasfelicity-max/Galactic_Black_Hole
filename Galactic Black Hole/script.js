import * as THREE from "https://esm.sh/three";
import {
  OrbitControls
} from 'https://esm.sh/three/examples/jsm/controls/OrbitControls.js';
import {
  EffectComposer
} from 'https://esm.sh/three/examples/jsm/postprocessing/EffectComposer.js';
import {
  RenderPass
} from 'https://esm.sh/three/examples/jsm/postprocessing/RenderPass.js';
import {
  UnrealBloomPass
} from 'https://esm.sh/three/examples/jsm/postprocessing/UnrealBloomPass.js';

const BLACK_HOLE_EVENT_HORIZON_RADIUS = 1.0;
const DISK_INNER_RADIUS = BLACK_HOLE_EVENT_HORIZON_RADIUS + 0.15;
const DISK_OUTER_RADIUS = 5.5;
const LENSING_SPHERE_RADIUS = BLACK_HOLE_EVENT_HORIZON_RADIUS + 0.07;
const GLOW_RADIUS_FACTOR = 1.07;
const PHOTON_SPHERE_RADIUS = BLACK_HOLE_EVENT_HORIZON_RADIUS * 1.5;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000004, 0.085);

const camera = new THREE.PerspectiveCamera(
  60, window.innerWidth / window.innerHeight, 0.1, 2000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.7,
  0.7,
  0.75
);
composer.addPass(bloomPass);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.rotateSpeed = 0.6;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.12;
controls.target.set(0, 0, 0);
controls.minDistance = 2.5;
controls.maxDistance = 100;
controls.enablePan = false;

let autoRotateEnabled = false;
const autoRotateToggle = document.getElementById('autoRotateToggle');
const rotateIconSVG = `<svg class="ui-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`;

function updateAutoRotateText() {
  autoRotateToggle.innerHTML = rotateIconSVG + `<span>Auto-Rotate: ${autoRotateEnabled ? "ON" : "OFF"}</span>`;
}
updateAutoRotateText();
autoRotateToggle.addEventListener('click', () => {
  autoRotateEnabled = !autoRotateEnabled;
  controls.autoRotate = autoRotateEnabled;
  updateAutoRotateText();
});

const triggerEffectButton = document.getElementById('triggerEffectButton');
const effectIconSVG = `<svg class="ui-icon" viewBox="0 0 24 24" style="stroke-width:1.5;" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="8"/></svg>`;
triggerEffectButton.innerHTML = effectIconSVG + `<span>Disk Echo</span>`;
triggerEffectButton.addEventListener('click', () => {
  triggerDiskEcho();
});

const starGeometry = new THREE.BufferGeometry();
const starCount = 45000;
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);
const starSizes = new Float32Array(starCount);
const starAlphas = new Float32Array(starCount);
const starFieldRadius = 1200;
const baseColor = new THREE.Color(0xffffff);
const blueColor = new THREE.Color(0xaaddff);
const yellowColor = new THREE.Color(0xffffaa);
const redColor = new THREE.Color(0xffcccc);
for (let i = 0; i < starCount; i++) {
  const i3 = i * 3;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const theta = 2 * Math.PI * i / goldenRatio;
  const phi = Math.acos(1 - 2 * (i + 0.5) / starCount);
  const radius = Math.cbrt(Math.random()) * starFieldRadius;
  starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  starPositions[i3 + 2] = radius * Math.cos(phi);
  const starColor = baseColor.clone();
  const colorType = Math.random();
  let colorIntensity = Math.random() * 0.4 + 0.6;
  if (colorType < 0.5) {
    starColor.lerp(blueColor, Math.random() * 0.3);
  } else if (colorType < 0.85) {
    starColor.lerp(yellowColor, Math.random() * 0.2);
    colorIntensity *= 0.9;
  } else {
    starColor.lerp(redColor, Math.random() * 0.15);
    colorIntensity *= 0.8;
  }
  starColor.multiplyScalar(colorIntensity);
  starColors[i3] = starColor.r;
  starColors[i3 + 1] = starColor.g;
  starColors[i3 + 2] = starColor.b;
  const sizeVariation = Math.random();
  if (sizeVariation > 0.997) {
    starSizes[i] = THREE.MathUtils.randFloat(1.5, 2.2);
  } else if (sizeVariation > 0.98) {
    starSizes[i] = THREE.MathUtils.randFloat(0.8, 1.5);
  } else {
    starSizes[i] = THREE.MathUtils.randFloat(0.3, 0.8);
  }
  const distFactor = Math.min(1.0, radius / starFieldRadius);
  starSizes[i] *= (1.0 - distFactor * 0.3);
  starAlphas[i] = Math.random() * 0.5 + 0.5;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
starGeometry.setAttribute('alpha', new THREE.BufferAttribute(starAlphas, 1));
const starMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: {
      value: 0.0
    },
    uDiskEchoActive: {
      value: 0.0
    },
    uDiskEchoIntensity: {
      value: 0.0
    }
  },
  vertexShader: `
        attribute float size;
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uDiskEchoActive;
        uniform float uDiskEchoIntensity;
        
        void main() {
            vColor = color;
            vAlpha = alpha;
            
            vec3 adjustedPosition = position;
            if (uDiskEchoActive > 0.0) {
                float distFromCenter = length(position);
                float pushFactor = uDiskEchoIntensity * 0.025 * smoothstep(50.0, 300.0, distFromCenter);
                adjustedPosition = position * (1.0 + pushFactor);
            }
            
            vec4 mvPosition = modelViewMatrix * vec4(adjustedPosition, 1.0);
            gl_PointSize = size * (350.0 / -mvPosition.z) * (1.0 + uDiskEchoIntensity * 0.35);
            gl_Position = projectionMatrix * mvPosition;
        }`,
  fragmentShader: `
        uniform float uTime;
        uniform float uDiskEchoIntensity;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
            float r = length(gl_PointCoord - vec2(0.5, 0.5));
            float baseAlpha = 1.0 - smoothstep(0.45, 0.5, r);
            if (baseAlpha < 0.01) discard;
            
            float twinkleSpeed = vAlpha * 1.5 + 0.5 + uDiskEchoIntensity * 4.0;
            float twinkleRange = 0.15 + uDiskEchoIntensity * 0.4;
            float twinkle = sin(uTime * twinkleSpeed + vAlpha * 10.0) * twinkleRange + 0.9;
            
            vec3 finalColor = vColor * twinkle * (1.0 + uDiskEchoIntensity * 0.9);
            
            gl_FragColor = vec4(finalColor, baseAlpha * vAlpha * (1.0 + uDiskEchoIntensity * 0.45));
        }`,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  vertexColors: true
});
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const blackHoleGeometry = new THREE.SphereGeometry(BLACK_HOLE_EVENT_HORIZON_RADIUS, 64, 32);
const blackHoleMaterial = new THREE.MeshBasicMaterial({
  color: 0x000000
});
const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
blackHole.renderOrder = 0;
scene.add(blackHole);

const themes = {
  inferno: {
    diskHot: new THREE.Color(0xffffff),
    diskMid: new THREE.Color(0xffaa33),
    diskEdge: new THREE.Color(0xcc331a),
    diskDeep: new THREE.Color(0x661a00),
    lensing: new THREE.Color(0xffcc66),
    glow: new THREE.Color(0xff8833),
    photonSphere: new THREE.Color(0xffbb44),
    primaryWave: new THREE.Color(0xffaa33),
    secondaryWave: new THREE.Color(0xff5500),
    tertiaryWave: new THREE.Color(0xffdd22)
  },
  ruby: {
    diskHot: new THREE.Color(0xFFE4E1),
    diskMid: new THREE.Color(0xE0115F),
    diskEdge: new THREE.Color(0x8B0000),
    diskDeep: new THREE.Color(0x550000),
    lensing: new THREE.Color(0xFF6347),
    glow: new THREE.Color(0xFF4500),
    photonSphere: new THREE.Color(0xFF7F50),
    primaryWave: new THREE.Color(0xFF4500),
    secondaryWave: new THREE.Color(0xE0115F),
    tertiaryWave: new THREE.Color(0xFF6347)
  },
  plasma: {
    diskHot: new THREE.Color(0xffffff),
    diskMid: new THREE.Color(0x66ff66),
    diskEdge: new THREE.Color(0x00cc4d),
    diskDeep: new THREE.Color(0x006626),
    lensing: new THREE.Color(0x99ff99),
    glow: new THREE.Color(0x66ff99),
    photonSphere: new THREE.Color(0x88ffaa),
    primaryWave: new THREE.Color(0x66ff99),
    secondaryWave: new THREE.Color(0x22ffaa),
    tertiaryWave: new THREE.Color(0xaaffcc)
  },
  void: {
    diskHot: new THREE.Color(0xffffff),
    diskMid: new THREE.Color(0x87cefa),
    diskEdge: new THREE.Color(0x1e90ff),
    diskDeep: new THREE.Color(0x00008b),
    lensing: new THREE.Color(0xb0e0e6),
    glow: new THREE.Color(0xadd8e6),
    photonSphere: new THREE.Color(0x99ccff),
    primaryWave: new THREE.Color(0xadd8e6),
    secondaryWave: new THREE.Color(0x1e90ff),
    tertiaryWave: new THREE.Color(0xb0e0e6)
  }
};
let currentThemeName = 'inferno';
let currentTheme = themes[currentThemeName];

const diskGeometry = new THREE.RingGeometry(DISK_INNER_RADIUS, DISK_OUTER_RADIUS, 128, 64);
const diskMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: {
      value: 0
    },
    uColorHot: {
      value: new THREE.Color().copy(currentTheme.diskHot)
    },
    uColorMid: {
      value: new THREE.Color().copy(currentTheme.diskMid)
    },
    uColorEdge: {
      value: new THREE.Color().copy(currentTheme.diskEdge)
    },
    uColorDeep: {
      value: new THREE.Color().copy(currentTheme.diskDeep)
    },
    uCameraPosition: {
      value: camera.position
    },

    uRippleActive: {
      value: 0.0
    },
    uRippleStartTime: {
      value: 0.0
    },
    uRippleDuration: {
      value: 2.8
    },
    uPrimaryWaveColor: {
      value: new THREE.Color(currentTheme.primaryWave)
    },
    uSecondaryWaveColor: {
      value: new THREE.Color(currentTheme.secondaryWave)
    },
    uTertiaryWaveColor: {
      value: new THREE.Color(currentTheme.tertiaryWave)
    },
    uRippleMaxRadius: {
      value: DISK_OUTER_RADIUS
    },
    uRippleThickness: {
      value: DISK_OUTER_RADIUS * 0.12
    },
    uRippleIntensity: {
      value: 0.0
    },
    uRippleDistortionStrength: {
      value: 0.0
    }
  },
  vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vRadius;
        uniform float uRippleDistortionStrength;
        uniform float uTime;
        
        void main() {
            vUv = uv;
            vPosition = position;
            vRadius = length(position.xy);
            
            vec3 adjustedPosition = position;
            if (uRippleDistortionStrength > 0.0) {
                float angle = atan(position.y, position.x);
                float distortionAmount = sin(angle * 10.0 + uTime * 7.0 + vRadius * 2.0) * 0.08 * uRippleDistortionStrength;
                adjustedPosition.z += distortionAmount;
            }
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(adjustedPosition, 1.0);
        }`,
  fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorHot;
        uniform vec3 uColorMid;
        uniform vec3 uColorEdge;
        uniform vec3 uColorDeep;
        uniform vec3 uCameraPosition;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vRadius;

        uniform float uRippleActive;
        uniform float uRippleStartTime;
        uniform float uRippleDuration;
        uniform vec3 uPrimaryWaveColor;
        uniform vec3 uSecondaryWaveColor;
        uniform vec3 uTertiaryWaveColor;
        uniform float uRippleMaxRadius;
        uniform float uRippleThickness;
        uniform float uRippleIntensity;

        float rand(vec2 n){return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);}
        
        float noise(vec2 p){
            vec2 ip=floor(p);
            vec2 u=fract(p);
            u=u*u*(3.0-2.0*u);
            float res=mix(mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
            return res*res;
        }
        
        float fbm(vec2 p, float timeOffset, float freq, int octaves) {
            float total=0.0;
            float amplitude=0.65;
            float persistence=0.5;
            for(int i=0;i<octaves;i++){
                float timeScale=0.6+0.12*float(i);
                float noiseVal = noise(p*freq+vec2(timeOffset*timeScale*0.45,timeOffset*timeScale*0.3));
                total+=amplitude*noiseVal;
                vec2 warpOffset=vec2(noiseVal*0.18,-noiseVal*0.12);
                p+=warpOffset*amplitude*0.5;
                freq*=2.0;
                amplitude*=persistence;
            }
            return total;
        }
        
        float vortexPattern(float dist, float angle, float time){
            float spiralStrength=5.8;
            float timeScale=0.6;
            float angleOffset=dist*0.28;
            float spiral=sin(angle*2.3+angleOffset+dist*spiralStrength-time*timeScale);
            return smoothstep(-0.38,0.68,spiral)*0.32;
        }
        
        float calculateRippleIntensity(float dist, float rippleProgress, float currentRippleRadius, float thickness, float speedFactor) {
            if (rippleProgress <= 0.0 || rippleProgress >= 1.0) return 0.0;
            
            float distToRippleCenter = abs(dist - currentRippleRadius);
            float halfThickness = thickness * 0.5 * mix(1.0, 0.25, rippleProgress);
            
            float waveEnergyFactor = pow(1.0 - rippleProgress, 0.8 * speedFactor);
            float waveShape = smoothstep(halfThickness, halfThickness - (thickness * 0.25), distToRippleCenter);
            
            float angle = atan(vPosition.y, vPosition.x);
            float angleMod = sin(angle * 10.0 + rippleProgress * 15.0) * 0.15 + 0.9;
            
            return waveShape * waveEnergyFactor * angleMod;
        }
        
        void main(){
            float dist = vRadius;
            float innerEdge = ${DISK_INNER_RADIUS.toFixed(2)};
            float outerEdge = ${DISK_OUTER_RADIUS.toFixed(2)};
            float normalizedPos = clamp((dist - innerEdge) / (outerEdge - innerEdge), 0.0, 1.0);
            float angle = atan(vPosition.y, vPosition.x);
            float orbitalVelocity = 1.0 / sqrt(max(dist, 0.1));
            float dopplerFactor = 0.0; float beamingFactor = 1.0;
            
            if (length(uCameraPosition) > 0.01) {
                vec3 tangentialDirection = normalize(vec3(-vPosition.y, vPosition.x, 0.0));
                vec3 toCamera = normalize(uCameraPosition - vPosition);
                dopplerFactor = dot(toCamera, tangentialDirection) * orbitalVelocity * 0.3;
                beamingFactor = 1.0 + dopplerFactor * 0.4;
                beamingFactor = clamp(beamingFactor, 0.5, 2.0);
            }
            
            float rotationSpeedFactor = 4.8/(pow(dist,1.6)+1.1);
            float rotatedAngle = angle-uTime*rotationSpeedFactor*0.52;
            vec2 baseCoord = vec2(dist*1.9, rotatedAngle*3.6);
            float evolvingTime = uTime*0.17;
            
            float noiseValueFast = fbm(baseCoord, evolvingTime * 1.2, 2.2, 6);
            float noiseValueSlow = fbm(baseCoord * 0.6, evolvingTime * 0.5, 1.5, 4);
            float noiseValue = noiseValueFast * 0.7 + noiseValueSlow * 0.4;
            float vortexValue = vortexPattern(dist, angle, uTime);
            float finalPattern = noiseValue*0.8 + vortexValue*1.1;
            
            float temperature = orbitalVelocity * (1.0 + finalPattern * 0.3);
            temperature = clamp(temperature, 0.0, 2.0);
            vec3 colorInner = mix(uColorHot, uColorMid, smoothstep(0.0, 0.40, normalizedPos) * (1.0 - temperature * 0.3));
            vec3 colorOuterBlend = mix(uColorMid, uColorEdge, smoothstep(0.40, 0.80, normalizedPos));
            vec3 colorDeepBlend = mix(uColorEdge, uColorDeep, smoothstep(0.80, 1.0, normalizedPos));
            vec3 color = mix(colorInner, colorOuterBlend, smoothstep(0.40, 0.80, normalizedPos));
            color = mix(color, colorDeepBlend, smoothstep(0.80, 1.0, normalizedPos));
            
            float redshiftFactor = dopplerFactor * 0.15;
            vec3 redshift = vec3(1.0 + redshiftFactor, 1.0, 1.0 - redshiftFactor);
            color *= redshift;
            
            float patternBrightness = (finalPattern+0.5)*1.15;
            patternBrightness += pow(max(0.0,finalPattern-0.5),1.3)*0.6;
            float radialBrightness = pow(1.0-smoothstep(0.0,0.8,normalizedPos),1.9)*3.0+0.25;
            float finalBrightness = patternBrightness*radialBrightness*beamingFactor;
            
            float combinedRippleIntensity = 0.0;
            vec3 rippleColorContribution = vec3(0.0);
            
            if (uRippleActive > 0.5) {
                float rippleTime = uTime - uRippleStartTime;
                float rippleProgress = clamp(rippleTime / uRippleDuration, 0.0, 1.0);
                
                float primarySpeed = 1.0;
                float primaryRadius = mix(innerEdge, uRippleMaxRadius, rippleProgress * primarySpeed);
                float primaryIntensity = calculateRippleIntensity(dist, rippleProgress, primaryRadius, uRippleThickness, primarySpeed);
                
                float secondarySpeed = 0.75;
                float secondaryProgress = max(0.0, rippleProgress - 0.1) * secondarySpeed;
                float secondaryRadius = mix(innerEdge, uRippleMaxRadius * 0.85, secondaryProgress);
                float secondaryIntensity = calculateRippleIntensity(dist, secondaryProgress, secondaryRadius, uRippleThickness * 0.8, secondarySpeed) * 0.8;
                
                float tertiarySpeed = 0.5;
                float tertiaryProgress = max(0.0, rippleProgress - 0.2) * tertiarySpeed;
                float tertiaryRadius = mix(innerEdge, uRippleMaxRadius * 0.7, tertiaryProgress);
                float tertiaryIntensity = calculateRippleIntensity(dist, tertiaryProgress, tertiaryRadius, uRippleThickness * 0.6, tertiarySpeed) * 0.6;
                
                combinedRippleIntensity = primaryIntensity + secondaryIntensity + tertiaryIntensity;
                
                rippleColorContribution = uPrimaryWaveColor * primaryIntensity +
                                            uSecondaryWaveColor * secondaryIntensity +
                                            uTertiaryWaveColor * tertiaryIntensity;
                                            
                float sparkleNoiseVal = rand(vUv * vec2(300.0, 500.0) + uTime * vec2(20.0 + primaryIntensity * 10.0, 30.0 + primaryIntensity * 15.0) );
                float sparkleThreshold = 0.985 - primaryIntensity * 0.03;
                if (primaryIntensity > 0.02 && sparkleNoiseVal > sparkleThreshold) {
                    float sparkleBrightness = pow((sparkleNoiseVal - sparkleThreshold) / (1.0 - sparkleThreshold), 2.0);
                    rippleColorContribution += mix(uPrimaryWaveColor, vec3(1.0), 0.6) * primaryIntensity * sparkleBrightness * 10.0 * uRippleIntensity;
                }

                float afterglowPulse = sin(rippleProgress * 15.0) * 0.5 + 0.5;
                float afterglowIntensity = smoothstep(0.0, 0.3, rippleProgress) * (1.0 - rippleProgress) * 0.4 * afterglowPulse;
                combinedRippleIntensity += afterglowIntensity * smoothstep(innerEdge, innerEdge + 1.5, dist);
            }
            
            float rippleBoost = combinedRippleIntensity * 9.0 * uRippleIntensity;
            color *= (finalBrightness + rippleBoost);
            
            if (combinedRippleIntensity * uRippleIntensity > 0.01) {
                float shimmerEffect = sin(angle * 20.0 + uTime * 10.0 + dist * 5.0) * 0.15 + 0.9;
                vec3 currentRippleColors = rippleColorContribution * shimmerEffect;
                color = mix(color, currentRippleColors * 1.8, min(1.0, combinedRippleIntensity * uRippleIntensity * 1.5));
            }

            float hotBoost = smoothstep(3.0, 5.0, finalBrightness + rippleBoost) * smoothstep(0.0, 0.1, normalizedPos);
            color = mix(color, vec3(1.0, 1.0, 1.0), hotBoost * 0.45);
            
            float innerAlpha = smoothstep(0.0, 0.06, normalizedPos);
            float outerAlpha = 1.0 - smoothstep(0.85, 1.0, normalizedPos);
            float noiseAlphaFactor = clamp(finalPattern * 0.35 + 0.75, 0.65, 1.0);
            float alpha = innerAlpha * outerAlpha * noiseAlphaFactor;
            
            float rippleAlphaBoost = combinedRippleIntensity * 0.9 * uRippleIntensity;
            
            color = clamp(color, 0.0, 8.0);
            gl_FragColor = vec4(color, clamp(alpha + rippleAlphaBoost, 0.0, 1.0));
        }`,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

const accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);
accretionDisk.rotation.x = Math.PI / 2.6;
accretionDisk.renderOrder = 1;
scene.add(accretionDisk);

const photonSphereGeometry = new THREE.SphereGeometry(PHOTON_SPHERE_RADIUS, 64, 32);
const photonSphereMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: {
      value: 0
    },
    uColor: {
      value: new THREE.Color().copy(currentTheme.photonSphere)
    },
    uDiskEchoActive: {
      value: 0.0
    },
    uDiskEchoIntensity: {
      value: 0.0
    }
  },
  vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mvPosition;
        }`,
  fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uDiskEchoActive;
        uniform float uDiskEchoIntensity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);
            
            float pulseRate = 2.0 + uDiskEchoIntensity * 8.0;
            float pulseDepth = 0.1 + uDiskEchoIntensity * 0.5;
            float pulse = sin(uTime * pulseRate) * pulseDepth + 0.9;
            
            float alpha = fresnel * (0.3 + uDiskEchoIntensity * 0.6) * pulse;
            
            vec3 finalColor = uColor;
            if (uDiskEchoActive > 0.5) {
                float colorPulse = sin(uTime * 4.0 + dot(vNormal, vec3(1.0)) * 5.0) * 0.5 + 0.5;
                finalColor = mix(finalColor, finalColor * vec3(1.4, 1.2, 0.8), colorPulse * uDiskEchoIntensity * 1.2);
                finalColor *= (1.0 + uDiskEchoIntensity * 0.7);
            }
            
            gl_FragColor = vec4(finalColor, alpha);
        }`,
  transparent: true,
  side: THREE.FrontSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const photonSphere = new THREE.Mesh(photonSphereGeometry, photonSphereMaterial);
photonSphere.renderOrder = 4;
scene.add(photonSphere);

const lensingGeometry = new THREE.SphereGeometry(LENSING_SPHERE_RADIUS, 64, 32);
const lensingMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: {
      value: 0
    },
    uLensingColor: {
      value: new THREE.Color().copy(currentTheme.lensing)
    },
    uDiskEchoActive: {
      value: 0.0
    },
    uDiskEchoIntensity: {
      value: 0.0
    }
  },
  vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mvPosition;
        }`,
  fragmentShader: `
        uniform float uTime;
        uniform vec3 uLensingColor;
        uniform float uDiskEchoActive;
        uniform float uDiskEchoIntensity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        float fresnel(vec3 d,vec3 n,float p){
            return pow(1.0-abs(dot(normalize(d),n)),p);
        }
        
        float rand(vec2 n){
            return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);
        }
        
        float noise(vec2 p){
            vec2 ip=floor(p);
            vec2 u=fract(p);
            u=u*u*(3.0-2.0*u);
            float res=mix(mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
            return res*res;
        }
        
        void main(){
            vec3 viewDir=normalize(vViewPosition);
            
            float fresnelPower = 5.2 - uDiskEchoIntensity * 1.5;
            float fF=fresnel(viewDir,vNormal,fresnelPower);
            
            float pulseSpeed = 0.55 + uDiskEchoIntensity * 3.0;
            float pulseDepth = 0.12 + uDiskEchoIntensity * 0.4;
            float p=(sin(uTime*pulseSpeed+length(vViewPosition)*0.12)*pulseDepth+0.95);
            
            float noiseScale = 7.0 + uDiskEchoIntensity * 5.0;
            float noiseSpeed = 0.35 + uDiskEchoIntensity * 1.2;
            vec2 nC=vNormal.xy*noiseScale+uTime*noiseSpeed;
            float nV=noise(nC)*(0.12 + uDiskEchoIntensity * 0.15);
            vec3 dN=normalize(vNormal+vec3(nV,nV*0.6,0.0));
            
            float alphaBase = 0.68 + uDiskEchoIntensity * 0.5;
            float a=fF*alphaBase*p;
            
            float edgePower = 8.5 - uDiskEchoIntensity * 3.5;
            a+=pow(1.0-abs(dot(viewDir,dN)),edgePower)*(0.38 + uDiskEchoIntensity * 0.6);
            
            vec3 finalColor = uLensingColor;
            if (uDiskEchoActive > 0.5) {
                float colorShift = dot(viewDir, vNormal) * 0.5 + 0.5;
                finalColor = mix(finalColor, finalColor * vec3(1.3, 1.1, 0.9), colorShift * uDiskEchoIntensity);
                finalColor *= (1.0 + uDiskEchoIntensity * 0.4);
            }
            
            gl_FragColor=vec4(finalColor, clamp(a,0.0,1.0)*0.90);
        }`,
  transparent: true,
  side: THREE.FrontSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const lensingEffectSphere = new THREE.Mesh(lensingGeometry, lensingMaterial);
lensingEffectSphere.scale.multiplyScalar(1.62);
lensingEffectSphere.renderOrder = 2;
scene.add(lensingEffectSphere);

const glowGeometry = new THREE.SphereGeometry(BLACK_HOLE_EVENT_HORIZON_RADIUS, 64, 32);
const glowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: {
      value: 0
    },
    uGlowColor: {
      value: new THREE.Color().copy(currentTheme.glow)
    },
    uDiskEchoActive: {
      value: 0.0
    },
    uDiskEchoIntensity: {
      value: 0.0
    },
    uDiskEchoColor: {
      value: new THREE.Color().copy(currentTheme.primaryWave)
    }
  },
  vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mvPosition;
        }`,
  fragmentShader: `
        uniform float uTime;
        uniform vec3 uGlowColor;
        uniform float uDiskEchoActive;
        uniform float uDiskEchoIntensity;
        uniform vec3 uDiskEchoColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        float rand(vec2 n){
            return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);
        }
        
        float noise(vec2 p){
            vec2 ip=floor(p);
            vec2 u=fract(p);
            u=u*u*(3.0-2.0*u);
            float res=mix(mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
            return res*res;
        }
        
        void main(){
            float glowPower = 2.6 - uDiskEchoIntensity * 1.2;
            float i=pow(0.68-dot(vNormal,normalize(vViewPosition)), glowPower);
            
            float pulseSpeed = 0.7 + uDiskEchoIntensity * 7.0;
            float pulseDepth = 0.18 + uDiskEchoIntensity * 0.5;
            float p=sin(uTime*pulseSpeed+vNormal.y*1.8)*pulseDepth+0.88;
            
            float noiseScale = 9.0 + uDiskEchoIntensity * 8.0;
            float noiseSpeed = 1.8 + uDiskEchoIntensity * 6.0;
            float f=noise(vNormal.xz*noiseScale+uTime*noiseSpeed)*(0.35 + uDiskEchoIntensity * 0.25)+0.75;
            
            float fI=clamp(i*p*f,0.0,1.0)*(0.92 + uDiskEchoIntensity * 0.5);
            
            vec3 finalColor = uGlowColor;
            if (uDiskEchoActive > 0.5) {
                float flarePattern = noise(vNormal.xy * 15.0 + uTime * 3.0) * noise(vNormal.yz * 12.0 + uTime * 2.0);
                float flarePulse = sin(uTime * 8.0 + flarePattern * 10.0) * 0.5 + 0.5;
                vec3 flareColor = mix(uGlowColor, uDiskEchoColor, flarePulse);
                
                finalColor = mix(uGlowColor, flareColor * 1.8, uDiskEchoIntensity * flarePulse * 1.2);
                finalColor *= (1.0 + uDiskEchoIntensity * 0.8);
            }
            
            gl_FragColor=vec4(finalColor, fI);
        }`,
  transparent: true,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const glowEffect = new THREE.Mesh(glowGeometry, glowMaterial);
glowEffect.scale.multiplyScalar(GLOW_RADIUS_FACTOR * 1.16);
glowEffect.renderOrder = 3;
scene.add(glowEffect);

let lastRippleTime = -Infinity;
const RIPPLE_COOLDOWN = 0.5;
let diskEchoIntensity = 0.0;
let diskEchoActive = false;
let diskEchoStartTime = 0;
const DISK_ECHO_DURATION = 2.8;

function triggerDiskEcho() {
  const currentTime = clock.getElapsedTime();
  if (currentTime - lastRippleTime < RIPPLE_COOLDOWN) {
    return;
  }
  lastRippleTime = currentTime;
  diskEchoStartTime = currentTime;
  diskEchoActive = true;

  diskMaterial.uniforms.uRippleActive.value = 1.0;
  diskMaterial.uniforms.uRippleStartTime.value = currentTime;

  diskMaterial.uniforms.uPrimaryWaveColor.value.copy(themes[currentThemeName].primaryWave).multiplyScalar(3.0);
  diskMaterial.uniforms.uSecondaryWaveColor.value.copy(themes[currentThemeName].secondaryWave).multiplyScalar(2.7);
  diskMaterial.uniforms.uTertiaryWaveColor.value.copy(themes[currentThemeName].tertiaryWave).multiplyScalar(2.4);

  glowMaterial.uniforms.uDiskEchoColor.value.copy(themes[currentThemeName].primaryWave).multiplyScalar(1.8);

  bloomPass.strength = 1.3;
  bloomPass.threshold = 0.60;
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerDown(event) {
  if (event.target.closest('.ui-panel')) return;
  if (event.isPrimary === false && event.pointerType !== 'touch') return;
  let x, y;
  if (event.touches && event.touches.length > 0) {
    x = event.touches[0].clientX;
    y = event.touches[0].clientY;
  } else {
    x = event.clientX;
    y = event.clientY;
  }
  pointer.x = (x / window.innerWidth) * 2 - 1;
  pointer.y = -(y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(blackHole, false);
  if (intersects.length > 0) triggerDiskEcho();
}
renderer.domElement.addEventListener('pointerdown', onPointerDown, false);

const themeButtonsContainer = document.getElementById('theme-buttons');
themeButtonsContainer.addEventListener('click', (event) => {
  const button = event.target.closest('.theme-button');
  if (button) {
    const themeName = button.dataset.theme;
    if (themes[themeName] && themeName !== currentThemeName) {
      currentThemeName = themeName;
      currentTheme = themes[currentThemeName];

      diskMaterial.uniforms.uColorHot.value.copy(currentTheme.diskHot);
      diskMaterial.uniforms.uColorMid.value.copy(currentTheme.diskMid);
      diskMaterial.uniforms.uColorEdge.value.copy(currentTheme.diskEdge);
      diskMaterial.uniforms.uColorDeep.value.copy(currentTheme.diskDeep);

      lensingMaterial.uniforms.uLensingColor.value.copy(currentTheme.lensing);
      glowMaterial.uniforms.uGlowColor.value.copy(currentTheme.glow);
      photonSphereMaterial.uniforms.uColor.value.copy(currentTheme.photonSphere);

      diskMaterial.uniforms.uPrimaryWaveColor.value.copy(currentTheme.primaryWave).multiplyScalar(3.0);
      diskMaterial.uniforms.uSecondaryWaveColor.value.copy(currentTheme.secondaryWave).multiplyScalar(2.7);
      diskMaterial.uniforms.uTertiaryWaveColor.value.copy(currentTheme.tertiaryWave).multiplyScalar(2.4);
      glowMaterial.uniforms.uDiskEchoColor.value.copy(currentTheme.primaryWave).multiplyScalar(1.8);

      themeButtonsContainer.querySelectorAll('.theme-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    }
  }
});

setTimeout(() => {
  const info = document.getElementById('info');
  if (info) info.style.opacity = '0';
}, 7000);

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.resolution.set(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  }, 150);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = clock.getDelta();

  diskMaterial.uniforms.uTime.value = elapsedTime;
  lensingMaterial.uniforms.uTime.value = elapsedTime;
  glowMaterial.uniforms.uTime.value = elapsedTime;
  starMaterial.uniforms.uTime.value = elapsedTime;
  photonSphereMaterial.uniforms.uTime.value = elapsedTime;
  diskMaterial.uniforms.uCameraPosition.value.copy(camera.position);

  if (diskEchoActive) {
    const timeSinceEchoStart = elapsedTime - diskEchoStartTime;
    const normalizedTime = timeSinceEchoStart / DISK_ECHO_DURATION;
    let intensityVal;

    if (normalizedTime < 0.07) {
      intensityVal = normalizedTime / 0.07;
    } else {
      const t = (normalizedTime - 0.07) / (1.0 - 0.07);
      intensityVal = Math.pow(1.0 - t, 1.8);
      intensityVal += Math.sin(t * Math.PI) * 0.35 * Math.pow(1.0 - t, 0.5);
    }
    diskEchoIntensity = Math.max(0.0, Math.min(1.0, intensityVal));

    const pulseFactor = Math.sin(elapsedTime * 15.0) * 0.15 + 1.0;
    diskEchoIntensity *= pulseFactor;
    diskEchoIntensity = Math.min(1.2, diskEchoIntensity);

    let distortionStrengthFactor = 0.0;
    if (normalizedTime < 0.4) {
      distortionStrengthFactor = Math.sin((normalizedTime / 0.4) * Math.PI);
    }
    diskMaterial.uniforms.uRippleDistortionStrength.value = distortionStrengthFactor * diskEchoIntensity * 2.0;


    if (timeSinceEchoStart >= DISK_ECHO_DURATION) {
      diskEchoActive = false;
      diskEchoIntensity = 0.0;
      diskMaterial.uniforms.uRippleActive.value = 0.0;
      diskMaterial.uniforms.uRippleDistortionStrength.value = 0.0;

      bloomPass.strength = 0.7;
      bloomPass.threshold = 0.75;
    }

    diskMaterial.uniforms.uRippleIntensity.value = diskEchoIntensity;
    starMaterial.uniforms.uDiskEchoActive.value = diskEchoActive ? 1.0 : 0.0;
    starMaterial.uniforms.uDiskEchoIntensity.value = diskEchoIntensity;
    photonSphereMaterial.uniforms.uDiskEchoActive.value = diskEchoActive ? 1.0 : 0.0;
    photonSphereMaterial.uniforms.uDiskEchoIntensity.value = diskEchoIntensity;
    lensingMaterial.uniforms.uDiskEchoActive.value = diskEchoActive ? 1.0 : 0.0;
    lensingMaterial.uniforms.uDiskEchoIntensity.value = diskEchoIntensity;
    glowMaterial.uniforms.uDiskEchoActive.value = diskEchoActive ? 1.0 : 0.0;
    glowMaterial.uniforms.uDiskEchoIntensity.value = diskEchoIntensity;
  }

  controls.update();
  stars.rotation.y += deltaTime * 0.004;
  stars.rotation.x += deltaTime * 0.0015;
  composer.render(deltaTime);
}

function initialCameraAnimation() {
  const startPosition = new THREE.Vector3(0, 15, 18);
  const endPosition = new THREE.Vector3(0, 5, 8);
  const duration = 4500;
  const startTime = Date.now();
  camera.position.copy(startPosition);
  controls.enabled = false;

  function updateCamera() {
    const elapsed = Date.now() - startTime;
    if (elapsed < duration) {
      const progress = elapsed / duration;
      const t = 1 - Math.pow(1 - progress, 5);
      camera.position.lerpVectors(startPosition, endPosition, t);
      controls.target.set(0, 0, 0);
      requestAnimationFrame(updateCamera);
    } else {
      camera.position.copy(endPosition);
      controls.target.set(0, 0, 0);
      controls.enabled = true;
    }
  }
  updateCamera();
}

window.onload = () => {
  initialCameraAnimation();
  animate();
}