#include <avr/io.h>
#include <util/delay.h>

/* =========================================================
   CONFIGURATION DES PINS - ATMEGA328P
   =========================================================
   Microcontrôleur : ATMEGA328P (Arduino compatible)
   Pont en H : BD62130
   
   Pins connectées :
   - PB2 (Arduino D10)  : PWM EN (Vitesse moteur) - OC1B
   - PB4 (Arduino D12)  : BD62130 IN1 (Direction)
   - PB5 (Arduino D13)  : BD62130 IN2 (Direction)
   - A0                 : Potentiomètre d'entrée (POT)
   
   Configuration PWM :
   - Fréquence : 4 kHz (période 250μs)
   - Rapport cyclique variable : 0-178μs on / 250μs total
   ========================================================= */
#define MOTOR_PWM   PB2   // OC1B - Sortie PWM vitesse (EN) - Alternative à PB1
#define MOTOR_IN1   PB4   // BD62130 IN1 - Contrôle direction
#define MOTOR_IN2   PB5   // BD62130 IN2 - Contrôle direction
#define POT_ADC     0     // Potentiomètre sur A0 (ADC0)

// Configuration Timer1 pour 250μs (4 kHz)
#define PWM_PERIOD  500   // ICR1 = 500, avec prescaler /8 : (500*8)/16MHz = 250μs
#define PWM_MAX     178   // Rapport cyclique max : 178μs / 250μs = 71.2%

/* =========================================================
   ADC - Lecture du potentiomètre (0-1023)
   ========================================================= */
void ADC_init() {
    // ADMUX : Référence interne AVCC, alignement droit, canal A0
    ADMUX = (1 << REFS0);
    
    // ADCSRA : ADC activé, prescaler /64 pour une fréquence ADC d'environ 125 kHz
    ADCSRA = (1 << ADEN) | (1 << ADPS2) | (1 << ADPS1);
}

uint16_t ADC_read(uint8_t channel) {
    // Sélection du canal ADC (A0 à A7)
    ADMUX = (ADMUX & 0xF0) | (channel & 0x0F);
    
    // Démarrer la conversion
    ADCSRA |= (1 << ADSC);
    
    // Attendre la fin de la conversion (le bit ADSC repasse à 0)
    while (ADCSRA & (1 << ADSC));
    
    // Retourner le résultat (10 bits : 0-1023)
    return ADC;
}

/* =========================================================
   TIMER1 - PWM pour contrôle vitesse BD62130
   Mode : Fast PWM avec TOP sur ICR1
   Fréquence PWM : 4 kHz (250μs)
   Prescaler : /8
   ========================================================= */
void PWM_init() {
    // Configuration des ports en sortie
    DDRB |= (1 << MOTOR_PWM) | (1 << MOTOR_IN1) | (1 << MOTOR_IN2);
    
    // Direction initiale : marche avant (IN1 = HIGH, IN2 = LOW)
    PORTB |=  (1 << MOTOR_IN1);      // IN1 = 1
    PORTB &= ~(1 << MOTOR_IN2);      // IN2 = 0
    
    // Configuration Timer1 - Mode Fast PWM avec TOP sur ICR1 (mode 14)
    // TCCR1A - PWM non-inversé sur OC1B (PB2)
    TCCR1A = (1 << COM1B1) | (1 << WGM11);
    
    // TCCR1B - Mode 14 (Fast PWM), Prescaler /8
    TCCR1B = (1 << WGM13) | (1 << WGM12) | (1 << CS11);
    
    // ICR1 : TOP = 500 pour période de 250μs
    // Calcul : (500 * 8) / 16MHz = 250μs
    ICR1 = PWM_PERIOD;
    
    // OCR1B : Rapport cyclique (0-178μs sur 250μs)
    OCR1B = 0;  // Initialisé à 0 (moteur arrêté)
}

/* =========================================================
   Contrôle de vitesse du moteur (0-178)
   Paramètre : vitesse (0 = arrêt, 178 = max sur 250μs)
   Conversion automatique du potentiomètre ADC (0-1023 -> 0-178)
   ========================================================= */
void set_motor_speed(uint16_t speed) {
    // Limitation à PWM_MAX (178)
    if (speed > PWM_MAX) {
        speed = PWM_MAX;
    }
    OCR1B = speed;
}

/* =========================================================
   Contrôle directionnel du moteur BD62130
   direction = 0 : Rotation avant (IN1=1, IN2=0)
   direction = 1 : Rotation arrière (IN1=0, IN2=1)
   ========================================================= */
void set_motor_direction(uint8_t direction) {
    if (direction == 0) {
        // Avant
        PORTB |=  (1 << MOTOR_IN1);    // IN1 = 1
        PORTB &= ~(1 << MOTOR_IN2);    // IN2 = 0
    } else {
        // Arrière
        PORTB &= ~(1 << MOTOR_IN1);    // IN1 = 0
        PORTB |=  (1 << MOTOR_IN2);    // IN2 = 1
    }
}

/* =========================================================
   PROGRAMME PRINCIPAL
   Lecture d'un potentiomètre pour contrôler la vitesse
   ========================================================= */
int main(void) {
    // Initialisation
    ADC_init();
    PWM_init();
    
    // Direction moteur fixée à l'avant
    set_motor_direction(0);
    
    // Boucle infinie
    while (1) {
        // Lire la valeur du potentiomètre (0-1023)
        uint16_t pot_value = ADC_read(POT_ADC);
        
        // Convertir 10 bits (0-1023) vers 0-178μs (rapport cyclique max)
        // Formule : (pot_value * 178) / 1023
        uint16_t pwm_value = (pot_value * PWM_MAX) / 1023;
        
        // Appliquer la vitesse au moteur
        set_motor_speed(pwm_value);
        
        // Délai pour la stabilité (~10 ms entre les lectures)
        _delay_ms(10);
    }
    
    return 0;
}
