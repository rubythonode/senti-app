import React, { useCallback, useMemo } from 'react';
import firebase from 'react-native-firebase';
import {
  withNavigation,
  NavigationInjectedProps,
} from 'react-navigation';
import {
  useQuery,
  useMutation,
} from '@apollo/react-hooks';
import { TagItem } from 'components';
import {
  FETCH_PROFILE,
  SUBSCRIBE_TAG,
  UNSUBSCRIBE_TAG,
} from 'graphqls';

interface Props extends NavigationInjectedProps {
  item: Tag;
}

const TagItemContainer: React.FunctionComponent<Props> = ({
  item,
  navigation,
}) => {
  const { data: profile } = useQuery<{ me: Profile }>(FETCH_PROFILE, {
    skip: !firebase.auth().currentUser,
    fetchPolicy: 'cache-only',
  });

  const [subscribeTag, { loading: subscribing }] = useMutation(SUBSCRIBE_TAG, {
    variables: {
      tag: item.name,
    },
    update: (cache) => {
      try {
        const savedProfile = cache.readQuery<{ me: Profile }>({ query: FETCH_PROFILE });

        if (!savedProfile) {
          return;
        }

        cache.writeQuery({
          query: FETCH_PROFILE,
          data: {
            me: {
              ...savedProfile.me,
              tags: savedProfile.me.tags.concat(item.name),
            },
          },
        });
      } catch {}
    },
  });

  const [unsubscribeTag, { loading: unsubscribing }] = useMutation(UNSUBSCRIBE_TAG, {
    variables: {
      tag: item.name,
    },
    update: (cache) => {
      try {
        const savedProfile = cache.readQuery<{ me: Profile }>({ query: FETCH_PROFILE });

        if (!savedProfile) {
          return;
        }

        cache.writeQuery({
          query: FETCH_PROFILE,
          data: {
            me: {
              ...savedProfile.me,
              tags: savedProfile.me.tags.filter(t => t !== item.name),
            },
          },
        });
      } catch {}
    },
  });

  const isSubscribed = useMemo(() => {
    return profile && profile.me ? !!profile.me.tags.find(t => t === item.id) : false;
  }, [item.id, profile]);

  const toggle = useCallback(() => {
    isSubscribed ? unsubscribeTag() : subscribeTag();
  }, [isSubscribed, subscribeTag, unsubscribeTag]);

  const openTagStoryScreen = useCallback(() => {
    navigation.navigate('TagStory', { tagId: item.id });
  }, [item.id, navigation]);

  return (
    <TagItem
      item={item}
      isSubscribed={isSubscribed}
      isLoading={subscribing || unsubscribing}
      toggle={toggle}
      openTagStoryScreen={openTagStoryScreen}
    />
  );
};

export default withNavigation(React.memo(TagItemContainer));
