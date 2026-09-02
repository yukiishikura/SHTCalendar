<?php
header('Content-Type: application/json; charset=utf-8');

$dir = __DIR__ . '/../data';
$backupDir = $dir . '/backups';

if (!file_exists($dir)) {
    mkdir($dir, 0777, true);
}
if (!file_exists($backupDir)) {
    mkdir($backupDir, 0777, true);
}

$file = $dir . '/work_data.json';

// データ読み込み API
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        echo $content ? $content : json_encode(new stdClass());
    } else {
        echo json_encode(new stdClass());
    }
    exit;
}

// データ保存 API（全自動：メインファイル ＋ 日付別自動バックアップ生成）
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    if ($input !== false) {
        $decoded = json_decode($input);
        if ($decoded !== null || $input === '{}') {
            $formattedJson = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            
            // 1. メインデータファイルへの自動上書き保存
            file_put_contents($file, $formattedJson);
            
            // 2. サーバー側での全自動日別バックアップ作成（ユーザーの手動操作不要）
            $todayBackupFile = $backupDir . '/work_data_' . date('Y-m-d') . '.json';
            file_put_contents($todayBackupFile, $formattedJson);

            echo json_encode(['status' => 'success', 'message' => 'Data automatically saved and backed up']);
            exit;
        }
    }
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
    exit;
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
