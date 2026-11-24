<?php
/* Αποστολή των φορμών «Επικοινωνία» και «Παράπονα» με email στη ΔΕΥΑΟ.
   Χρειάζεται PHP με mail() (υπάρχει στο Plesk του ΟΤΕ). */

date_default_timezone_set('Europe/Athens');

const TO = 'deyaor@otenet.gr';
const FROM = 'no-reply@deyao.gr';
const FORMS = [
    'epikoinonia' => ['subject' => 'Μήνυμα από τη φόρμα επικοινωνίας', 'back' => '/epikoinonia.html'],
    'parapona'    => ['subject' => 'Παράπονο / πρόταση από την ιστοσελίδα', 'back' => '/parapona.html'],
];

function field($k, $max = 200) {
    $v = isset($_POST[$k]) ? trim((string)$_POST[$k]) : '';
    $v = str_replace(["\r\n", "\r"], "\n", $v);
    return mb_substr($v, 0, $max, 'UTF-8');
}
function oneline($v) { return trim(preg_replace('/[\r\n\t]+/', ' ', $v)); }

$ajax = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;
function done($ok, $back, $ajax, $code = 200) {
    if ($ajax) {
        http_response_code($ok ? 200 : $code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok]);
    } else {
        header('Location: ' . $back . ($ok ? '?sent=1' : '?error=1') . '#form', true, 303);
    }
    exit;
}

$form = field('form', 20);
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset(FORMS[$form])) { http_response_code(400); exit('Bad request'); }
$cfg = FORMS[$form];

// παγίδα για bots: κρυφό πεδίο που ο άνθρωπος αφήνει κενό
if (field('website') !== '') done(true, $cfg['back'], $ajax);

$name = oneline(field('name', 120));
$contact = oneline(field('contact', 160));
$topic = oneline(field('topic', 40));
$message = field('message', 5000);
if ($name === '' || $contact === '' || $message === '') done(false, $cfg['back'], $ajax, 422);
if ($form === 'epikoinonia' && !filter_var($contact, FILTER_VALIDATE_EMAIL)) done(false, $cfg['back'], $ajax, 422);

$body = "Ονοματεπώνυμο: $name\n"
      . "Email / τηλέφωνο: $contact\n"
      . ($topic !== '' ? "Θέμα: $topic\n" : '')
      . "\nΜήνυμα:\n$message\n\n"
      . "--\nΣτάλθηκε από τη φόρμα " . $cfg['back'] . " του deyao.gr, " . date('d/m/Y H:i') . "\n";

$subject = $cfg['subject'] . ($topic !== '' ? " ($topic)" : '') . " – $name";
$headers = [
    'From: =?UTF-8?B?' . base64_encode('Ιστοσελίδα ΔΕΥΑΟ') . '?= <' . FROM . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];
if (filter_var($contact, FILTER_VALIDATE_EMAIL)) $headers[] = 'Reply-To: ' . $contact;

$ok = mail(TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers), '-f' . FROM);
done($ok, $cfg['back'], $ajax, 500);
