# KarrOS Notification Types

This document lists the notification categories currently supported in KarrOS. These can be toggled on or off in the **System Settings**.

## 1. Financial Alerts
| Type | ID | Description |
|------|----|-------------|
| **Low Balance** | `notification_low_balance` | Triggered when a pocket balance drops below £10. |
| **Large Transaction** | `notification_large_transaction` | Triggered for single transactions exceeding £500. |

## 2. System & Integration
| Type | ID | Description |
|------|----|-------------|
| **Bank Sync** | `notification_bank_sync` | Alerts when a Monzo/Bank sync completes or encounters an error. |
| **Goal Milestones** | `notification_goal_milestone` | Triggered when you reach 25%, 50%, 75% or 100% of a savings goal. |
| **Reminders** | `notification_reminders` | Daily/Weekly check-in reminders (e.g. "Weekend Hub"). |

## 3. Communication
| Type | ID | Description |
|------|----|-------------|
| **Monzo Transactions** | `notification_transactions` | Real-time alerts for every Monzo spend and income event. |
| **Direct Messages** | `notification_dm` | Alerts for incoming messages from the AI Co-pilot or system. |
