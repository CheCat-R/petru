<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventoSitio extends Model
{
    public const TIPOS = ['pageview', 'product_view', 'add_to_cart', 'checkout_start', 'order'];

    protected $table = 'eventos_sitio';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['creado_en' => 'datetime'];
    }

    /** Hosts conocidos → fuente legible. El orden importa: el primero que matchea gana. */
    private const FUENTES = [
        'instagram' => ['instagram.com', 'ig.me'],
        'facebook' => ['facebook.com', 'fb.com', 'fb.me', 'messenger.com'],
        'tiktok' => ['tiktok.com'],
        'whatsapp' => ['whatsapp.com', 'wa.me'],
        'google' => ['google.', 'googleadservices.com'],
        'youtube' => ['youtube.com', 'youtu.be'],
        'pinterest' => ['pinterest.'],
        'x' => ['x.com', 't.co', 'twitter.com'],
        'mercadolibre' => ['mercadolibre.com', 'mercadopago.com'],
        'bing' => ['bing.com'],
    ];

    /**
     * De dónde vino la visita. Los UTM mandan sobre el referente (una campaña
     * de Instagram Ads llega con referente de Instagram pero es "campaña").
     */
    public static function fuenteDe(?string $referente, ?string $utmSource, ?string $utmMedium): string
    {
        if (filled($utmSource)) {
            $s = strtolower($utmSource);
            foreach (array_keys(self::FUENTES) as $fuente) {
                if (str_contains($s, $fuente) || ($fuente === 'x' && $s === 'twitter')) {
                    return $fuente;
                }
            }

            return in_array(strtolower((string) $utmMedium), ['email', 'newsletter'], true) ? 'email' : 'campaña';
        }

        if (blank($referente)) {
            return 'directo';
        }

        foreach (self::FUENTES as $fuente => $hosts) {
            foreach ($hosts as $host) {
                if (str_contains($referente, $host)) {
                    return $fuente;
                }
            }
        }

        return 'otro';
    }

    public static function dispositivoDe(?int $ancho): string
    {
        return match (true) {
            $ancho === null => 'escritorio',
            $ancho < 768 => 'movil',
            $ancho < 1024 => 'tablet',
            default => 'escritorio',
        };
    }
}
