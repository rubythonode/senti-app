import React from 'react';
import {
  FlatList,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  SafeAreaView,
  SafeAreaViewForceInsetValue,
} from 'react-navigation';
import {
  LoadingBar,
  StoryItem,
} from 'components';
import { AudioService } from 'services';
import { palette } from 'constants/style';

const {
  width: deviceWidth,
  height: deviceHeight,
} = Dimensions.get('window');

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 100 };

const SAFE_AREA_INSET: {
  bottom: SafeAreaViewForceInsetValue;
} = {
  bottom: 'always',
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

interface Props {
  items: Story[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasBottom?: boolean;
  onFetchMore: () => void;
  onRefresh: () => void;
}

class StoryList extends React.PureComponent<Props> {
  private swiperAnimation = new Animated.Value(0);

  private previousItem?: Story;

  public render() {
    const {
      items,
      isLoading,
      isRefreshing,
      hasBottom,
      onFetchMore,
      onRefresh,
    } = this.props;

    return (
      <React.Fragment>
        <AnimatedFlatList
          data={items}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
          onEndReached={onFetchMore}
          onRefresh={onRefresh}
          refreshing={isRefreshing}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: this.swiperAnimation } } }],
            { useNativeDriver: true },
          )}
          onViewableItemsChanged={this.onViewableItemsChanged}
          viewabilityConfig={VIEWABILITY_CONFIG}
          style={styles.container}
          scrollEnabled
          pagingEnabled
          horizontal={false}
          scrollEventThrottle={10}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />
        {isLoading && (
          <SafeAreaView forceInset={SAFE_AREA_INSET} style={[styles.loading, hasBottom && styles.bottomSpace]}>
            <LoadingBar />
          </SafeAreaView>
        )}
      </React.Fragment>
    );
  }

  private renderItem = ({ item, index }: { item: Story; index: number }) => (
    <StoryItem
      item={item}
      index={index}
      animatedValue={this.swiperAnimation}
      hasBottom={this.props.hasBottom}
    />
  )

  private keyExtractor = (item: Story) => item.id;

  private onViewableItemsChanged = ({ viewableItems }: { viewableItems: Array<{ item: Story }> }) => {
    if (viewableItems.length > 0) {
      const currentItem = viewableItems[0].item;
      if (this.previousItem !== currentItem) {
        AudioService.play(currentItem.audio.url);
        this.previousItem = currentItem;
      }
    }
  }
}

const styles = StyleSheet.create({
  container: {
    width: deviceWidth,
    height: deviceHeight,
    backgroundColor: palette.black.default,
  },
  loading: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomSpace: {
    bottom: 50,
  },
});

export default StoryList;
