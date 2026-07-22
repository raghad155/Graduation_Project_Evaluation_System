<?php $pdo = new PDO('mysql:host=127.0.0.1;dbname=project_evaluation_system', 'root', ''); echo json_encode($pdo->query('SELECT id, title FROM evaluation_groups')->fetchAll(PDO::FETCH_ASSOC));
