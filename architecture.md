```txt
desktop-tanaw/
├── public/
│   ├── favicon.ico
│   └── logo.svg
│
├── resources/
│   ├── icons/
│   │   ├── icon.ico
│   │   ├── icon.icns
│   │   └── icon.png
│   │
│   └── models/
│       └── placeholder.txt
│
├── scripts/
│   ├── dev-start-python.ts
│   ├── build-python.ts
│   └── package-app.ts
│
├── python/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── camera_routes.py
│   │   │   │   ├── counting_routes.py
│   │   │   │   ├── health_routes.py
│   │   │   │   └── sync_routes.py
│   │   │   │
│   │   │   └── server.py
│   │   │
│   │   ├── camera/
│   │   │   ├── rtsp_client.py
│   │   │   ├── onvif_discovery.py
│   │   │   ├── camera_config.py
│   │   │   └── frame_reader.py
│   │   │
│   │   ├── detection/
│   │   │   ├── detector.py
│   │   │   ├── model_loader.py
│   │   │   └── detection_result.py
│   │   │
│   │   ├── tracking/
│   │   │   ├── tracker.py
│   │   │   ├── track_state.py
│   │   │   └── unique_identity_cache.py
│   │   │
│   │   ├── counting/
│   │   │   ├── tripwire_counter.py
│   │   │   ├── direction_resolver.py
│   │   │   ├── visitor_counter.py
│   │   │   └── tourist_counter.py
│   │   │
│   │   ├── storage/
│   │   │   ├── local_database.py
│   │   │   ├── count_repository.py
│   │   │   ├── camera_repository.py
│   │   │   └── sync_queue_repository.py
│   │   │
│   │   ├── sync/
│   │   │   ├── cloud_sync_service.py
│   │   │   ├── sync_queue.py
│   │   │   ├── retry_policy.py
│   │   │   └── duplicate_guard.py
│   │   │
│   │   ├── config/
│   │   │   ├── settings.py
│   │   │   └── environment.py
│   │   │
│   │   ├── utils/
│   │   │   ├── datetime_utils.py
│   │   │   ├── id_generator.py
│   │   │   └── logger.py
│   │   │
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── README.md
│
├── src/
│   ├── main/
│   │   ├── app/
│   │   │   ├── createWindow.ts
│   │   │   ├── appLifecycle.ts
│   │   │   └── menu.ts
│   │   │
│   │   ├── ipc/
│   │   │   ├── camera.ipc.ts
│   │   │   ├── counting.ipc.ts
│   │   │   ├── sync.ipc.ts
│   │   │   ├── settings.ipc.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── services/
│   │   │   ├── pythonService.ts
│   │   │   ├── cameraProcessService.ts
│   │   │   ├── localStorageService.ts
│   │   │   ├── syncStatusService.ts
│   │   │   └── appUpdateService.ts
│   │   │
│   │   ├── config/
│   │   │   ├── electron.config.ts
│   │   │   └── paths.config.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   └── safeJson.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── preload/
│   │   ├── api/
│   │   │   ├── cameraApi.ts
│   │   │   ├── countingApi.ts
│   │   │   ├── syncApi.ts
│   │   │   ├── settingsApi.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── types/
│   │   │   └── preload.types.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── renderer/
│   │   ├── app/
│   │   │   ├── layouts/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   └── SetupLayout.tsx
│   │   │   │
│   │   │   ├── providers/
│   │   │   │   ├── AppProviders.tsx
│   │   │   │   └── QueryProvider.tsx
│   │   │   │
│   │   │   ├── router/
│   │   │   │   ├── AppRouter.tsx
│   │   │   │   └── routes.ts
│   │   │   │
│   │   │   └── App.tsx
│   │   │
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── logos/
│   │   │
│   │   ├── features/
│   │   │   ├── setup/
│   │   │   │   ├── components/
│   │   │   │   │   ├── SetupStepper.tsx
│   │   │   │   │   ├── EnterpriseLoginForm.tsx
│   │   │   │   │   └── GatewayRegistrationForm.tsx
│   │   │   │   │
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useSetup.ts
│   │   │   │   │
│   │   │   │   ├── pages/
│   │   │   │   │   ├── SetupPage.tsx
│   │   │   │   │   └── LoginPage.tsx
│   │   │   │   │
│   │   │   │   ├── services/
│   │   │   │   │   └── setupService.ts
│   │   │   │   │
│   │   │   │   ├── types/
│   │   │   │   │   └── setup.types.ts
│   │   │   │   │
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── cameras/
│   │   │   │   ├── components/
│   │   │   │   │   ├── CameraForm.tsx
│   │   │   │   │   ├── CameraTable.tsx
│   │   │   │   │   ├── CameraStatusBadge.tsx
│   │   │   │   │   ├── CameraPreview.tsx
│   │   │   │   │   └── TripwireCanvas.tsx
│   │   │   │   │
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useCameras.ts
│   │   │   │   │   ├── useCameraPreview.ts
│   │   │   │   │   └── useTripwireConfig.ts
│   │   │   │   │
│   │   │   │   ├── services/
│   │   │   │   │   └── cameraService.ts
│   │   │   │   │
│   │   │   │   ├── types/
│   │   │   │   │   └── camera.types.ts
│   │   │   │   │
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── counting/
│   │   │   │   ├── components/
│   │   │   │   │   ├── CountSummaryCards.tsx
│   │   │   │   │   ├── LiveCountingPanel.tsx
│   │   │   │   │   ├── CountingStatusBadge.tsx
│   │   │   │   │   └── CountingSessionControls.tsx
│   │   │   │   │
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useCounting.ts
│   │   │   │   │   └── useCountingStatus.ts
│   │   │   │   │
│   │   │   │   ├── services/
│   │   │   │   │   └── countingService.ts
│   │   │   │   │
│   │   │   │   ├── types/
│   │   │   │   │   └── counting.types.ts
│   │   │   │   │
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── sync/
│   │   │   │   ├── components/
│   │   │   │   │   ├── SyncStatusCard.tsx
│   │   │   │   │   ├── SyncQueueTable.tsx
│   │   │   │   │   └── ManualSyncButton.tsx
│   │   │   │   │
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useSyncStatus.ts
│   │   │   │   │   └── useManualSync.ts
│   │   │   │   │
│   │   │   │   ├── services/
│   │   │   │   │   └── syncService.ts
│   │   │   │   │
│   │   │   │   ├── types/
│   │   │   │   │   └── sync.types.ts
│   │   │   │   │
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── local-records/
│   │   │   │   ├── components/
│   │   │   │   │   ├── LocalRecordsTable.tsx
│   │   │   │   │   └── LocalRecordDetailsCard.tsx
│   │   │   │   │
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useLocalRecords.ts
│   │   │   │   │
│   │   │   │   ├── services/
│   │   │   │   │   └── localRecordsService.ts
│   │   │   │   │
│   │   │   │   ├── types/
│   │   │   │   │   └── localRecord.types.ts
│   │   │   │   │
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── diagnostics/
│   │   │   │   ├── components/
│   │   │   │   │   ├── DiagnosticsPanel.tsx
│   │   │   │   │   ├── ServiceHealthCard.tsx
│   │   │   │   │   └── LogViewer.tsx
│   │   │   │   │
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useDiagnostics.ts
│   │   │   │   │
│   │   │   │   ├── services/
│   │   │   │   │   └── diagnosticsService.ts
│   │   │   │   │
│   │   │   │   ├── types/
│   │   │   │   │   └── diagnostics.types.ts
│   │   │   │   │
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── components/
│   │   │       │   ├── AppSettingsForm.tsx
│   │   │       │   ├── CameraSettingsForm.tsx
│   │   │       │   ├── SyncSettingsForm.tsx
│   │   │       │   └── StorageSettingsForm.tsx
│   │   │       │
│   │   │       ├── hooks/
│   │   │       │   └── useSettings.ts
│   │   │       │
│   │   │       ├── services/
│   │   │       │   └── settingsService.ts
│   │   │       │
│   │   │       ├── types/
│   │   │       │   └── settings.types.ts
│   │   │       │
│   │   │       └── index.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CamerasPage.tsx
│   │   │   ├── LiveCountingPage.tsx
│   │   │   ├── LocalRecordsPage.tsx
│   │   │   ├── SyncPage.tsx
│   │   │   ├── DiagnosticsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   │
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── buttons/
│   │   │   │   ├── cards/
│   │   │   │   ├── forms/
│   │   │   │   ├── modals/
│   │   │   │   ├── table/
│   │   │   │   └── layout/
│   │   │   │
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   │
│   │   └── main.tsx
│   │
│   └── shared/
│       ├── constants/
│       │   ├── channels.ts
│       │   ├── appEvents.ts
│       │   └── status.ts
│       │
│       ├── types/
│       │   ├── camera.types.ts
│       │   ├── counting.types.ts
│       │   ├── sync.types.ts
│       │   └── ipc.types.ts
│       │
│       └── utils/
│           ├── dateUtils.ts
│           └── formatters.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron.vite.config.ts
└── README.md
```
