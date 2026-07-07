from django.test import TestCase

from .models import Location
from .views import (
    calculate_baseline_score,
    parse_lgbtq_score,
    score_crime_grade,
    score_safety,
)


class ExploreScoringTests(TestCase):
    def make_location(self, **overrides):
        data = {
            "name": "Test City",
            "state": "TC",
            "climate": "Mild",
            "cost_of_living": "Moderate",
            "population": "100,000",
            "tags": ["Golf", "Hiking", "Arts"],
            "has_va": True,
            "crime": "B+",
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

    def test_baseline_score_includes_lgbtq_rating(self):
        friendly = self.make_location(lgbtq_rating="95")
        less_friendly = self.make_location(name="Lower Score", lgbtq_rating="35")

        self.assertGreater(
            calculate_baseline_score(friendly),
            calculate_baseline_score(less_friendly),
        )

    def test_safety_scored_from_crime_letter_grade(self):
        safe = self.make_location(name="Safe", crime="A+")
        risky = self.make_location(name="Risky", crime="F")

        self.assertGreater(score_safety(safe), score_safety(risky))
        self.assertEqual(score_crime_grade(safe), 100)
        self.assertEqual(score_crime_grade(risky), 20)

    def test_safety_falls_back_to_neutral_without_a_grade(self):
        loc = self.make_location(name="No Grade", crime=None)
        self.assertIsNone(score_crime_grade(loc))
        self.assertEqual(score_safety(loc), 60)

    def test_baseline_score_reflects_crime_grade(self):
        safe = self.make_location(name="Safe City", crime="A+")
        risky = self.make_location(name="Risky City", crime="F")

        self.assertGreater(
            calculate_baseline_score(safe),
            calculate_baseline_score(risky),
        )
