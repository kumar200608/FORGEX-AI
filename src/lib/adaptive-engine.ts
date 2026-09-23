import {
  AdaptiveMode,
  AdaptiveProfile,
  DeviceProfile,
  ImageQualityStrategy,
  JsTier,
  NetworkProfile,
  PrefetchStrategy,
  RecommendationsTiming,
  SimulationPreset,
} from '../types';

export function computeAdaptiveProfile(
  network: NetworkProfile,
  device: DeviceProfile,
  simulationPreset: SimulationPreset = 'none'
): AdaptiveProfile {
  // If demo simulation is enabled, override network and device profiles for judge demonstration
  if (simulationPreset !== 'none') {
    return computeSimulatedProfile(simulationPreset, device.isReducedMotion);
  }

  const reasons: string[] = [];

  // 1. Offline condition
  if (!network.isOnline || network.classification === 'OFFLINE') {
    return {
      mode: 'OFFLINE',
      jsTier: 'LITE',
      imageStrategy: 'minimal',
      imageTargetWidth: 150,
      prefetchStrategy: 'DISABLED',
      animationsEnabled: false,
      reducedMotion: true,
      recommendations: 'disabled',
      compressionLabel: 'Offline Cached Assets',
      isSimulated: false,
      reasons: ['Device is disconnected from the network. Non-critical requests and prefetching are suspended.'],
    };
  }

  // 2. Data Saver check
  if (network.saveData) {
    reasons.push('Data Saver mode enabled by user: applying 30% compression reduction and Lite mode.');
    return {
      mode: 'LITE',
      jsTier: 'LITE',
      imageStrategy: 'low',
      imageTargetWidth: 210,
      prefetchStrategy: 'DISABLED',
      animationsEnabled: false,
      reducedMotion: true,
      recommendations: 'deferred',
      compressionLabel: '30% Compression Reduction (Data Saver)',
      isSimulated: false,
      reasons,
    };
  }

  // 3. Bottleneck Analysis: evaluate the weakest link between Network and Device
  const isNetworkConstrained = network.classification === 'SLOW';
  const isNetworkModerate = network.classification === 'MODERATE';
  const isDeviceConstrained = device.classification === 'LOW';
  const isDeviceMedium = device.classification === 'MEDIUM';

  let mode: AdaptiveMode;
  let jsTier: JsTier;
  let imageStrategy: ImageQualityStrategy;
  let imageTargetWidth: number;
  let prefetchStrategy: PrefetchStrategy;
  let animationsEnabled: boolean;
  let recommendations: RecommendationsTiming;
  let compressionLabel: string;

  // Severely constrained tier
  if (isNetworkConstrained || isDeviceConstrained) {
    mode = 'LITE';
    jsTier = 'LITE';
    imageStrategy = 'low';
    imageTargetWidth = 300;
    prefetchStrategy = 'DISABLED';
    animationsEnabled = false;
    recommendations = 'deferred';
    compressionLabel: 'High compression (300px, 50% q)';

    if (isNetworkConstrained) {
      reasons.push(`Network is ${network.effectiveType.toUpperCase()} (RTT: ${network.rttMs}ms, DL: ${network.downlinkMb.toFixed(1)}Mbps).`);
    }
    if (isDeviceConstrained) {
      reasons.push(`Device is resource-constrained (${device.hardwareConcurrency} cores, ${device.deviceMemoryGb ? device.deviceMemoryGb + 'GB RAM' : 'low memory'}).`);
    }
    compressionLabel = 'High compression (300px WebP, 50% quality)';
  }
  // Moderate tier
  else if (isNetworkModerate || isDeviceMedium) {
    mode = 'STANDARD';
    jsTier = 'STANDARD';
    imageStrategy = 'medium';
    imageTargetWidth = 600;
    prefetchStrategy = 'LIMITED';
    animationsEnabled = !device.isReducedMotion;
    recommendations = 'delayed';
    compressionLabel = 'Balanced (600px WebP, 70% quality)';

    if (isNetworkModerate) {
      reasons.push(`Network is 3G/moderate speed (${network.downlinkMb.toFixed(1)}Mbps, RTT: ${network.rttMs}ms).`);
    }
    if (isDeviceMedium) {
      reasons.push(`Device is mid-tier (${device.hardwareConcurrency} cores, balanced memory budget).`);
    }
  }
  // High-performance tier (5G / Ultra-Fast vs 4G)
  else if (network.classification === 'ULTRA_FAST' || network.effectiveType === '5g' || network.downlinkMb >= 30) {
    mode = 'ENHANCED';
    jsTier = 'ENHANCED';
    imageStrategy = 'ultra-4k';
    imageTargetWidth = 3840;
    prefetchStrategy = 'AGGRESSIVE';
    animationsEnabled = !device.isReducedMotion;
    recommendations = 'instant';
    compressionLabel = '5G Ultra 4K UHD (Lossless 3840px Master)';

    reasons.push(`⚡ 5G Gigabit Connection (${network.downlinkMb.toFixed(1)}Mbps, ${network.rttMs}ms RTT) enabling uncompressed 4K UHD assets & instant prefetching.`);
  }
  else {
    mode = 'ENHANCED';
    jsTier = 'ENHANCED';
    imageStrategy = 'high';
    imageTargetWidth = 1200;
    prefetchStrategy = 'AGGRESSIVE';
    animationsEnabled = !device.isReducedMotion;
    recommendations = 'instant';
    compressionLabel = 'Lossless/High-Res (1200px WebP, 85% quality)';

    reasons.push(`Strong 4G network (${network.downlinkMb.toFixed(1)}Mbps, ${network.rttMs}ms RTT) and multi-core device.`);
  }

  // Motion preference override
  if (device.isReducedMotion) {
    animationsEnabled = false;
    reasons.push('User preference prefers-reduced-motion is active: animations disabled.');
  }

  return {
    mode,
    jsTier,
    imageStrategy,
    imageTargetWidth,
    prefetchStrategy,
    animationsEnabled,
    reducedMotion: device.isReducedMotion,
    recommendations,
    compressionLabel,
    isSimulated: false,
    reasons,
  };
}

function computeSimulatedProfile(preset: SimulationPreset, isReducedMotion: boolean): AdaptiveProfile {
  switch (preset) {
    case 'fast-5g':
      return {
        mode: 'ENHANCED',
        jsTier: 'ENHANCED',
        imageStrategy: 'ultra-4k',
        imageTargetWidth: 3840,
        prefetchStrategy: 'AGGRESSIVE',
        animationsEnabled: !isReducedMotion,
        reducedMotion: isReducedMotion,
        recommendations: 'instant',
        compressionLabel: 'Simulated: 5G Ultra 4K UHD (Lossless 3840px Master)',
        isSimulated: true,
        simulationName: '⚡ 5G Ultra Gigabit + 4K UHD (300Mbps)',
        reasons: ['Simulated Condition: 5G Ultra-Wideband (300Mbps, 10ms RTT) & 16-core flagship workstation with Lossless 4K UHD Assets.'],
      };

    case 'fast-high':
      return {
        mode: 'ENHANCED',
        jsTier: 'ENHANCED',
        imageStrategy: 'high',
        imageTargetWidth: 1200,
        prefetchStrategy: 'AGGRESSIVE',
        animationsEnabled: !isReducedMotion,
        reducedMotion: isReducedMotion,
        recommendations: 'instant',
        compressionLabel: 'Simulated: High-Res 1200px (Aggressive Prefetch)',
        isSimulated: true,
        simulationName: 'Fast 4G + High Device',
        reasons: ['Simulated Condition: 4G Network (15Mbps, 25ms RTT) & 8-core High-performance workstation.'],
      };

    case 'moderate-med':
      return {
        mode: 'STANDARD',
        jsTier: 'STANDARD',
        imageStrategy: 'medium',
        imageTargetWidth: 600,
        prefetchStrategy: 'LIMITED',
        animationsEnabled: !isReducedMotion,
        reducedMotion: isReducedMotion,
        recommendations: 'delayed',
        compressionLabel: 'Simulated: Balanced 600px (Limited Hover Prefetch)',
        isSimulated: true,
        simulationName: '3G + Medium Device',
        reasons: ['Simulated Condition: Regular 3G Network (2.0Mbps, 250ms RTT) & 4-core mobile processor.'],
      };

    case 'slow-low':
      return {
        mode: 'LITE',
        jsTier: 'LITE',
        imageStrategy: 'low',
        imageTargetWidth: 300,
        prefetchStrategy: 'DISABLED',
        animationsEnabled: false,
        reducedMotion: true,
        recommendations: 'deferred',
        compressionLabel: 'Simulated: Lite 300px (No Prefetch, Zero Animations)',
        isSimulated: true,
        simulationName: 'Slow 3G + Low Device',
        reasons: ['Simulated Condition: Throttled Slow 3G (400kbps, 600ms RTT) & 2-core budget phone.'],
      };

    case 'offline':
      return {
        mode: 'OFFLINE',
        jsTier: 'LITE',
        imageStrategy: 'minimal',
        imageTargetWidth: 150,
        prefetchStrategy: 'DISABLED',
        animationsEnabled: false,
        reducedMotion: true,
        recommendations: 'disabled',
        compressionLabel: 'Simulated: Offline Mode (Cached Only)',
        isSimulated: true,
        simulationName: 'Offline Simulation',
        reasons: ['Simulated Condition: Zero connectivity. All remote fetches suspended.'],
      };

    default:
      return {
        mode: 'STANDARD',
        jsTier: 'STANDARD',
        imageStrategy: 'medium',
        imageTargetWidth: 600,
        prefetchStrategy: 'LIMITED',
        animationsEnabled: true,
        reducedMotion: false,
        recommendations: 'delayed',
        compressionLabel: 'Default Balanced',
        isSimulated: false,
        reasons: ['Default baseline configuration.'],
      };
  }
}
