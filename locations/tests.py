from django.test import TestCase

from .models import Location
from .views import calculate_baseline_score, calculate_match_score, parse_lgbtq_score


class ExploreScoringTests(TestCase):
    def make_location(self, **overrides):
        data = {
            "name": "Test City",
            "state": "TC",
            "match_score": 0,
            "avg_price": "$300k",
            "climate": "Mild",
            "cost_of_living": "Moderate",
            "population": "100k",
            "tags": ["Golf", "Hiking", "Arts"],
            "va_distance": "10 miles",
            "has_va": "Yes",
            "tci": 90,
            "col_index": 95,
            "avg_home_value": 300000,
            "lgbtq_rating": "80",
        }
        data.update(overrides)
        return Location.objects.create(**data)

    def test_parse_lgbtq_score_uses_higher_is_better_scale(self):
        self.assertEqual(parse_lgbtq_score("84"), 84)
        self.assertEqual(parse_lgbtq_score("100"), 100)
        self.assertIsNone(parse_lgbtq_score(None))

    def test_lgbtq_filter_rewards_scores_at_or_above_threshold(self):
        friendly = self.make_location(lgbtq_rating="70")
        unfriendly = self.make_location(name="Low Score", lgbtq_rating="69")

        self.assertGreaterEqual(
            calculate_match_score(friendly, {"lgbtq_friendly": True}),
            calculate_match_score(unfriendly, {"lgbtq_friendly": True}),
        )

    def test_baseline_score_includes_lgbtq_rating(self):
        friendly = self.make_location(lgbtq_rating="95")
        less_friendly = self.make_location(name="Lower Score", lgbtq_rating="35")

        self.assertGreater(calculate_baseline_score(friendly), calculate_baseline_score(less_friendly))
