package com.yair681.budgetx;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class BudgetWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.budget_widget);
        try {
            SharedPreferences prefs = context.getSharedPreferences("CAPPreferences", Context.MODE_PRIVATE);
            String json = prefs.getString("CapacitorStorage.supermarket_budget_v2", null);

            if (json != null) {
                JSONObject data = new JSONObject(json);
                double monthlyBudget = data.optDouble("monthlyBudget", 3000);
                JSONArray trips = data.optJSONArray("trips");

                String currentMonth = new SimpleDateFormat("yyyy-MM", Locale.US).format(new Date());
                double spent = 0;
                if (trips != null) {
                    for (int i = 0; i < trips.length(); i++) {
                        JSONObject trip = trips.getJSONObject(i);
                        String date = trip.optString("date", "");
                        if (date.startsWith(currentMonth)) {
                            spent += trip.optDouble("total", 0);
                        }
                    }
                }

                double remaining = monthlyBudget - spent;
                String remainingStr = String.format(Locale.US, "₪%.0f", Math.abs(remaining));
                String spentStr = String.format(Locale.US, "הוצאת ₪%.0f / ₪%.0f", spent, monthlyBudget);
                String statusStr = remaining >= 0 ? "נותר החודש" : "⚠️ חרגת מהתקציב";
                int color = remaining >= 0 ? 0xFF4ADE80 : 0xFFEF4444;

                views.setTextViewText(R.id.widget_remaining, remainingStr);
                views.setTextViewText(R.id.widget_spent, spentStr);
                views.setTextViewText(R.id.widget_status, statusStr);
                views.setTextColor(R.id.widget_remaining, color);
            } else {
                views.setTextViewText(R.id.widget_remaining, "---");
                views.setTextViewText(R.id.widget_spent, "פתח את האפליקציה");
                views.setTextViewText(R.id.widget_status, "נותר החודש");
                views.setTextColor(R.id.widget_remaining, 0xFFFFFFFF);
            }
        } catch (Exception e) {
            views.setTextViewText(R.id.widget_remaining, "---");
            views.setTextViewText(R.id.widget_spent, "שגיאה");
            views.setTextViewText(R.id.widget_status, "");
            views.setTextColor(R.id.widget_remaining, 0xFFFFFFFF);
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
